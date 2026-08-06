import connectDb from "@/db/connectDb";
import { requireAdmin } from "@/lib/auth";
import { computeSalarySummary } from "@/lib/salaryCalc";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";

const COMPANY_NAME = "SIDDHI GLASS & PLYWOOD CENTER";

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

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).font("Helvetica-Bold").fillColor("#000").text(COMPANY_NAME, { align: "center" });
  doc.moveDown(0.2);
  doc.fontSize(16).font("Helvetica-Bold").text("Account Statement (Base Salary)", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").fillColor("#555").text(`Period: ${from} to ${to}`, { align: "center" });
  doc.moveDown(1);

  const colX = { name: 40, acc: 200, ifsc: 350, amount: 470 };

  const drawHeader = (y) => {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#000");
    doc.text("Bank Name", colX.name, y);
    doc.text("Account No.", colX.acc, y);
    doc.text("IFSC Code", colX.ifsc, y);
    doc.text("Amount (Rs.)", colX.amount, y);
    doc.moveTo(40, y + 15).lineTo(555, y + 15).strokeColor("#ccc").stroke();
  };

  let y = doc.y;
  drawHeader(y);
  y += 25;

  let grandTotal = 0;
  doc.font("Helvetica").fontSize(10).fillColor("#222");

  // Amount column uses baseIncome so add/deduct adjustments are excluded
  summary.forEach((emp) => {
    if (y > 750) {
      doc.addPage();
      y = 40;
      drawHeader(y);
      y += 25;
    }
    doc.text(emp.bankName || emp.name, colX.name, y, { width: 150 });
    doc.text(emp.accountNumber || "-", colX.acc, y, { width: 140 });
    doc.text(emp.ifscCode || "-", colX.ifsc, y, { width: 110 });
    doc.text(emp.baseIncome.toFixed(2), colX.amount, y, { width: 80 });
    grandTotal += emp.baseIncome;
    y += 20;
  });

  doc.moveTo(40, y + 5).lineTo(555, y + 5).strokeColor("#ccc").stroke();
  doc.font("Helvetica-Bold").text(`Total: Rs. ${grandTotal.toFixed(2)}`, colX.amount, y + 12);

  // Authorised Signature & Stamp block at the bottom
  const sigBlockHeight = 100;
  if (y + 12 + sigBlockHeight > 780) {
    doc.addPage();
    y = 40;
  } else {
    y += 12;
  }

  const sigY = 780 - sigBlockHeight > y + 40 ? 780 - sigBlockHeight : y + 40;

  doc.moveTo(40, sigY).lineTo(200, sigY).strokeColor("#999").stroke();
  doc.fontSize(10).font("Helvetica").fillColor("#333").text("Authorised Signature", 40, sigY + 5);

  doc.moveTo(395, sigY).lineTo(555, sigY).strokeColor("#999").stroke();
  doc.fontSize(10).font("Helvetica").fillColor("#333").text("Company Stamp", 395, sigY + 5);

  doc.end();
  const pdfBuffer = await done;

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="account-salary-${from}-to-${to}.pdf"`,
    },
  });
}