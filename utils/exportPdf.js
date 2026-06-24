// utils/exportPdf.js
// Generates a professional A4 PDF from a single company's price list.
// Depends on: jspdf  jspdf-autotable
// Install: npm install jspdf jspdf-autotable

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * exportPriceListPdf
 * @param {Object} company  – full company document (with subCategories & products)
 */
export function exportPriceListPdf(company) {
  const companyName = company?.companyName?.trim() || "Unnamed Company";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W   = 210;
  const PAGE_H   = 297;
  const MARGIN   = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const HEADER_H = 28;
  const FOOTER_Y = PAGE_H - 8;

  // ── Brand colours ──────────────────────────────────────────────────────────
  const PRIMARY   = [30, 64, 175];   // blue-700
  const SECONDARY = [241, 245, 249]; // slate-100
  const ACCENT    = [100, 116, 139]; // slate-500

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  // Draws the blue header band. Called on every page (including ones added
  // mid-table by autoTable) so a multi-page export never has a bare,
  // unbranded page with no idea which company or document it belongs to.
  function drawHeader() {
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, PAGE_W, HEADER_H, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("PRICE LIST", MARGIN, 12);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(companyName.toUpperCase(), MARGIN, 20);

    doc.setFontSize(9);
    doc.text(`Generated: ${dateStr}`, PAGE_W - MARGIN, 20, { align: "right" });
  }

  drawHeader();
  let cursorY = HEADER_H + 8;

  if (!company.subCategories?.length) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...ACCENT);
    doc.text("No sub-categories or products have been added yet.", MARGIN, cursorY + 4);
  }

  // ── Iterate sub-categories ─────────────────────────────────────────────────
  company.subCategories?.forEach((subCat, idx) => {
    // Page break if there isn't room for the heading bar plus at least one row
    if (cursorY > PAGE_H - 40) {
      doc.addPage();
      drawHeader();
      cursorY = HEADER_H + 8;
    }

    // Sub-category heading bar
    doc.setFillColor(...SECONDARY);
    doc.rect(MARGIN, cursorY - 4, CONTENT_W, 8, "F");
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, cursorY - 4, MARGIN, cursorY + 4);          // left accent bar

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY);
    doc.text(`${idx + 1}.  ${subCat.name}`, MARGIN + 3, cursorY + 1);

    cursorY += 8;

    if (!subCat.products?.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...ACCENT);
      doc.text("No products in this sub-category.", MARGIN + 3, cursorY + 4);
      cursorY += 12;
      return;
    }

    // Product table
    // Safely coerce price fields to numbers before formatting. Source data may
    // have rate/netPrice/dp stored as strings (form inputs) or missing entirely
    // (older records, optional fields left blank) — calling .toLocaleString()
    // directly on those values throws and silently breaks the whole export.
    const fmtPrice = (n) => {
      const num = Number(n);
      return Number.isFinite(num) ? num.toLocaleString("en-IN") : "—";
    };

    const head = [["Product Name", "Code", "Thickness", "Sr.No ", "Net Price ", "DP "]];
    const body = subCat.products.map((p) => [
      p.productName || "—",
      p.code || "—",
      p.thickness || "—",
      fmtPrice(p.rate),
      fmtPrice(p.netPrice),
      fmtPrice(p.dp),
    ]);

    autoTable(doc, {
      startY: cursorY,
      head,
      body,
      // top/bottom reserve room for the header band and the footer line on
      // any continuation page this table spills onto
      margin: { left: MARGIN, right: MARGIN, top: HEADER_H + 8, bottom: 16 },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 30, 30],
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: PRIMARY,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: "auto" },     // product name fills remaining width
        1: { cellWidth: 24 },
        2: { cellWidth: 22 },
        3: { cellWidth: 26, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
        5: { cellWidth: 26, halign: "right" },
      },
      // Re-draw the header on every page this table spans, so a table that
      // splits across pages never leaves a bare page with no context.
      didDrawPage: drawHeader,
    });

    cursorY = doc.lastAutoTable.finalY + 10;
  });

  // ── Footer pass ────────────────────────────────────────────────────────────
  // Done last, once the real page count is known, so "Page X of Y" is
  // accurate — instead of reporting how many pages existed at the moment
  // each individual table happened to render.
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...ACCENT);
    doc.text(
      `${companyName}  ·  Price List  ·  Page ${i} of ${pageCount}`,
      PAGE_W / 2,
      FOOTER_Y,
      { align: "center" }
    );
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const filename = `${companyName.replace(/\s+/g, "_")}_PriceList_${Date.now()}.pdf`;
  doc.save(filename);
}