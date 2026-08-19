// PDF export helpers for the Policies module.
// Requires: npm install jspdf jspdf-autotable
// Both are dynamically imported so this file is safe to import from a
// "use client" component without breaking SSR.
//
// NOTE on jspdf-autotable versions: v4+ no longer patches `doc.autoTable(...)`
// onto the jsPDF prototype. Instead it exports a standalone function that
// takes the doc as its first argument: `autoTable(doc, options)`. This file
// uses that call style, which also happens to still work on v3.

const COMPANY_NAME = "Your Company Name"; // TODO: replace with real company name
const PAGE_MARGIN = 40;

async function loadPdfLibs() {
  const { jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default || autoTableModule;
  return { jsPDF, autoTable };
}

function addHeader(doc, title, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 90, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(COMPANY_NAME, PAGE_MARGIN, 35);

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text(title, PAGE_MARGIN, 58);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(subtitle, PAGE_MARGIN, 75);
  }

  doc.setTextColor(0, 0, 0);
  return 110; // y position to continue from
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Generated ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" }
    );
  }
}

function statusBadgeColor(status) {
  switch (status) {
    case "active":
      return [22, 163, 74]; // green-600
    case "draft":
      return [217, 119, 6]; // amber-600
    case "archived":
      return [100, 116, 139]; // slate-500
    default:
      return [100, 116, 139];
  }
}

function renderPolicyBlock(doc, policy, startY, autoTable) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY;

  // Policy title bar
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(PAGE_MARGIN - 10, y - 14, pageWidth - (PAGE_MARGIN - 10) * 2, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(policy.title, PAGE_MARGIN, y + 2);

  const [r, g, b] = statusBadgeColor(policy.status);
  doc.setFontSize(8);
  doc.setTextColor(r, g, b);
  doc.text(
    `${(policy.status || "active").toUpperCase()}  •  v${policy.version || "1.0"}`,
    pageWidth - PAGE_MARGIN,
    y + 2,
    { align: "right" }
  );

  y += 22;

  if (policy.description) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105); // slate-600
    const descLines = doc.splitTextToSize(policy.description, pageWidth - PAGE_MARGIN * 2);
    doc.text(descLines, PAGE_MARGIN, y);
    y += descLines.length * 12 + 6;
  }

  const rows = (policy.rules || [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((rule, idx) => [String(idx + 1), rule.text]);

  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [["#", "Rule"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 6, textColor: [30, 41, 41] },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" }, // indigo-600
    columnStyles: { 0: { cellWidth: 24, halign: "center" } },
  });

  return doc.lastAutoTable.finalY + 24;
}

/**
 * Export a single policy (all of its rules) as a standalone PDF.
 */
export async function exportPolicyPDF(policy) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const categoryName = policy.category?.name || "Uncategorized";
  let y = addHeader(doc, policy.title, `Category: ${categoryName}`);

  y = renderPolicyBlock(doc, policy, y, autoTable);

  addFooter(doc);
  doc.save(`${policy.title.replace(/[^a-z0-9]+/gi, "-")}.pdf`);
}

/**
 * Export every rule from every policy in a single category as one PDF.
 */
export async function exportCategoryPDF(category, policies) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = addHeader(
    doc,
    `${category.name} Policies`,
    `${policies.length} polic${policies.length === 1 ? "y" : "ies"} • Exported ${new Date().toLocaleDateString()}`
  );

  policies.forEach((policy) => {
    if (y > pageHeight - 150) {
      doc.addPage();
      y = 40;
    }
    y = renderPolicyBlock(doc, policy, y, autoTable);
  });

  addFooter(doc);
  doc.save(`${category.name.replace(/[^a-z0-9]+/gi, "-")}-policies.pdf`);
}

/**
 * Export every policy across every category, grouped with a section
 * heading per category, as one master PDF.
 */
export async function exportAllPoliciesPDF(categories, policiesByCategory) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  const totalPolicies = Object.values(policiesByCategory).reduce((sum, arr) => sum + arr.length, 0);

  let y = addHeader(
    doc,
    "Company Policy Handbook",
    `${categories.length} categories • ${totalPolicies} policies • Exported ${new Date().toLocaleDateString()}`
  );

  categories.forEach((category) => {
    const policies = policiesByCategory[category.slug] || [];
    if (policies.length === 0) return;

    if (y > pageHeight - 180) {
      doc.addPage();
      y = 40;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text(category.name.toUpperCase(), PAGE_MARGIN, y);
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1.2);
    doc.line(PAGE_MARGIN, y + 6, pageWidth - PAGE_MARGIN, y + 6);
    y += 28;

    policies.forEach((policy) => {
      if (y > pageHeight - 150) {
        doc.addPage();
        y = 40;
      }
      y = renderPolicyBlock(doc, policy, y, autoTable);
    });

    y += 10;
  });

  addFooter(doc);
  doc.save(`company-policy-handbook-${Date.now()}.pdf`);
}
