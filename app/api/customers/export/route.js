// app/api/customers/export/route.js
// GET /api/customers/export?format=csv|excel|pdf&category=&bloodGroup=&religion=&city=&name=&fields=full|namephone
//
// npm install xlsx jspdf jspdf-autotable

import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import Customer from "@/models/CustomerData";

async function fetchFiltered(searchParams) {
  const category   = searchParams.get("category")?.trim()  || "";
  const bloodGroup = searchParams.get("bloodGroup")?.trim()|| "";
  const religion   = searchParams.get("religion")?.trim()  || "";
  const city       = searchParams.get("city")?.trim()      || "";
  const name       = searchParams.get("name")?.trim()      || "";

  const query = {};
  if (category)   query.category   = new RegExp(category, "i");
  if (bloodGroup) query.bloodGroup = bloodGroup;
  if (religion)   query.religion   = new RegExp(religion, "i");
  if (city)       query.city       = new RegExp(city, "i");
  if (name) {
    query.$or = [
      { firstName:  new RegExp(name, "i") },
      { middleName: new RegExp(name, "i") },
      { lastName:   new RegExp(name, "i") },
    ];
  }

  return Customer.find(query).sort({ createdAt: -1 }).lean();
}

const fullName = (c) =>
  [c.firstName, c.middleName, c.lastName].filter(Boolean).join(" ");

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
};

export async function GET(request) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const fields = searchParams.get("fields") || "full";

    const customers = await fetchFiltered(searchParams);

    const namePhoneHeaders = ["Sr.No", "Name", "Mobile 1", "Mobile 2", "Birth Date"];
    const fullHeaders = [
      "Sr.No", "Name", "Birth Date",
      "Address 1", "Address 2", "Area", "City", "District", "State", "Pincode",
      "Blood Group", "Religion", "Mobile 1", "Mobile 2", "Category",
    ];

    const headers = fields === "namephone" ? namePhoneHeaders : fullHeaders;

    const rows = customers.map((c, i) => {
      if (fields === "namephone") {
        return [i + 1, fullName(c), c.mobile1, c.mobile2, fmtDate(c.birthDate)];
      }
      return [
        i + 1, fullName(c), fmtDate(c.birthDate),
        c.address1, c.address2, c.area, c.city, c.district, c.state, c.pincode,
        c.bloodGroup, c.religion, c.mobile1, c.mobile2, c.category,
      ];
    });

    // ── CSV ───────────────────────────────────────────────────────────────────
    if (format === "csv") {
      const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
      return new NextResponse(lines.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="customers_${Date.now()}.csv"`,
        },
      });
    }

    // ── Excel ─────────────────────────────────────────────────────────────────
    if (format === "excel") {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = headers.map((h) => ({ wch: h === "Name" ? 30 : 18 }));
      XLSX.utils.book_append_sheet(wb, ws, "Customers");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="customers_${Date.now()}.xlsx"`,
        },
      });
    }

    // ── PDF ───────────────────────────────────────────────────────────────────
    if (format === "pdf") {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(14);
      doc.text("Customer Report", 14, 15);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}  |  Total: ${customers.length}`, 14, 22);
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 27,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [240, 249, 255] },
        columnStyles: { 1: { cellWidth: 40 } },
      });
      const pdfBytes = doc.output("arraybuffer");
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="customers_${Date.now()}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Export failed: " + err.message }, { status: 500 });
  }
}