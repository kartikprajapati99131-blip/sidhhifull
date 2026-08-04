import connectDb from "@/db/connectDb";
import { requireAdmin } from "@/lib/auth";
import { computeSalarySummary } from "@/lib/salaryCalc";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";

export async function GET(req) {
  await connectDb();
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo = now.toISOString().split("T")[0];
  const from = searchParams.get("from") || defaultFrom;
  const to = searchParams.get("to") || defaultTo;

  const summary = await computeSalarySummary({ from, to });

  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(16).font("Helvetica-Bold").text("Personal Salary Statement", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").fillColor("#555").text(`Period: ${from} to ${to}`, { align: "center" });
  doc.moveDown(1);

  const colX = {
    name: 40,
    hours: 175,
    comp: 230,
    eff: 290,
    hourly: 355,
    base: 415,
    adj: 490,
    total: 565,
  };

  const drawHeader = (y) => {
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#000");
    doc.text("Employee Name", colX.name, y);
    doc.text("Worked Hrs", colX.hours, y, { width: 50 });
    doc.text("Comp. Hrs", colX.comp, y, { width: 55 });
    doc.text("Total Eff. Hrs", colX.eff, y, { width: 60 });
    doc.text("Rate/Hr", colX.hourly, y, { width: 55 });
    doc.text("Base Salary", colX.base, y, { width: 70 });
    doc.text("Adj. (+/-)", colX.adj, y, { width: 70 });
    doc.text("Total Income", colX.total, y, { width: 90 });
    doc.moveTo(40, y + 15).lineTo(760, y + 15).strokeColor("#ccc").stroke();
  };

  let y = doc.y;
  drawHeader(y);
  y += 25;

  doc.font("Helvetica").fontSize(9).fillColor("#222");

  summary.forEach((emp) => {
    if (y > 500) {
      doc.addPage();
      y = 40;
      drawHeader(y);
      y += 25;
    }
    doc.text(emp.name, colX.name, y, { width: 150 });
    doc.text(emp.totalHours.toFixed(1), colX.hours, y, { width: 50 });
    doc.text(emp.compensationHours.toFixed(1), colX.comp, y, { width: 55 });
    doc.text(emp.totalEffectiveHours.toFixed(1), colX.eff, y, { width: 60 });
    doc.text(emp.hourlyRate.toFixed(2), colX.hourly, y, { width: 55 });
    doc.text(emp.baseIncome.toFixed(2), colX.base, y, { width: 70 });
    doc.text(`${emp.adjustments >= 0 ? "+" : ""}${emp.adjustments.toFixed(2)}`, colX.adj, y, { width: 70 });
    doc.text(emp.totalIncome.toFixed(2), colX.total, y, { width: 90 });
    y += 20;

    if (emp.transactions.length > 0) {
      doc.fontSize(7).fillColor("#777");
      emp.transactions.forEach((t) => {
        doc.text(
          `${t.date} - ${t.type === "debit" ? "-" : "+"}Rs.${t.amount} ${t.remark ? "(" + t.remark + ")" : ""}`,
          colX.name + 10,
          y
        );
        y += 10;
      });
      doc.fontSize(9).fillColor("#222");
    }
  });

  doc.end();
  const pdfBuffer = await done;

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="personal-salary-${from}-to-${to}.pdf"`,
    },
  });
}
