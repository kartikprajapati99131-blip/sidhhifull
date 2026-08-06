import connectDb from "@/db/connectDb";
import { requireAdmin } from "@/lib/auth";
import { computeSalarySummary } from "@/lib/salaryCalc";
import ExcelJS from "exceljs";

export const runtime = "nodejs";

const COMPANY_NAME = "SIDDHI GLASS & PLYWOOD CENTER";

// Same month-name helper used implicitly by your uploaded sheet's title
// (e.g. "July Salary Statement")
function monthLabel(fromStr) {
  const d = new Date(fromStr);
  return d.toLocaleString("en-US", { month: "long" });
}

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

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Table 2");

  ws.columns = [
    { key: "bankName", width: 37.33 },
    { key: "accountNumber", width: 29.66 },
    { key: "ifscCode", width: 26.83 },
    { key: "amount", width: 19 },
  ];

  const mediumBorder = { style: "medium" };
  const thinBorder = { style: "thin" };

  // Title row (merged, wrapped, same as uploaded template)
  ws.mergeCells("A1:D1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `${COMPANY_NAME}                                                                 ${monthLabel(
    from
  )} Salary Statement\nPeriod: ${from} to ${to}`;
  titleCell.font = { name: "Times New Roman", size: 18, bold: false };
  titleCell.alignment = { horizontal: "center", vertical: "top", wrapText: true };
  titleCell.border = { top: mediumBorder, left: mediumBorder, right: mediumBorder };
  ws.getRow(1).height = 71.25;

  // Header row
  const headerRow = ws.getRow(2);
  headerRow.values = ["Bank Name", "Account No.", "IFSC Code", "Amount (Rs.)"];
  headerRow.height = 16.7;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 10, bold: true };
    cell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
    cell.border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
  });
  headerRow.getCell(4).border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: mediumBorder };

  // Data rows
  let rowIdx = 3;
  summary.forEach((emp) => {
    const row = ws.getRow(rowIdx);
    row.getCell(1).value = emp.bankName || emp.name;
    row.getCell(2).value = emp.accountNumber ? Number(emp.accountNumber) : "-";
    row.getCell(3).value = emp.ifscCode || "-";
    row.getCell(4).value = emp.totalIncome;

    row.getCell(1).font = { name: "Arial MT", size: 10, bold: false };
    row.getCell(1).alignment = { horizontal: "left", vertical: "top", wrapText: true };

    row.getCell(2).font = { name: "Arial MT", size: 12, bold: true };
    row.getCell(2).numFmt = "0";
    row.getCell(2).alignment = { horizontal: "left", vertical: "top" };

    row.getCell(3).font = { name: "Arial MT", size: 10, bold: false };
    row.getCell(3).alignment = { horizontal: "left", vertical: "top", wrapText: true };

    row.getCell(4).font = { name: "Arial MT", size: 12, bold: true };
    row.getCell(4).numFmt = "0.00";
    row.getCell(4).alignment = { horizontal: "right", vertical: "top" };

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: thinBorder,
        bottom: thinBorder,
        left: thinBorder,
        right: colNumber === 4 ? mediumBorder : thinBorder,
      };
    });

    row.height = 20.1;
    rowIdx += 1;
  });

  const lastDataRow = rowIdx - 1;

  // Total row
  const totalRow = ws.getRow(rowIdx);
  totalRow.getCell(3).value = "TOTAL";
  totalRow.getCell(3).font = { name: "Times New Roman", size: 12, bold: false };
  totalRow.getCell(3).alignment = { horizontal: "center", wrapText: true };

  totalRow.getCell(4).value = { formula: `SUM(D3:D${lastDataRow})` };
  totalRow.getCell(4).font = { name: "Arial", size: 12, bold: true };
  totalRow.getCell(4).numFmt = "0.00";
  totalRow.getCell(4).alignment = { horizontal: "right", wrapText: true };
  totalRow.getCell(4).border = { right: mediumBorder };
  totalRow.height = 28.35;
  rowIdx += 1;

  // Spacer row (matches uploaded template's row 16)
  ws.getRow(rowIdx).height = 13.5;
  rowIdx += 2; // leaves a blank row like the template's row 17

  // Authorised Signature & Company Stamp row (merged like the template's A18:D18)
  ws.mergeCells(`A${rowIdx}:B${rowIdx}`);
  const sigCell = ws.getCell(`A${rowIdx}`);
  sigCell.value = "Authorised Signature";
  sigCell.font = { name: "Arial", size: 10 };
  sigCell.alignment = { horizontal: "left", vertical: "top" };
  sigCell.border = { top: thinBorder };

  ws.mergeCells(`C${rowIdx}:D${rowIdx}`);
  const stampCell = ws.getCell(`C${rowIdx}`);
  stampCell.value = "Company Stamp";
  stampCell.font = { name: "Arial", size: 10 };
  stampCell.alignment = { horizontal: "right", vertical: "top" };
  stampCell.border = { top: thinBorder };
  ws.getRow(rowIdx).height = 16.5;

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bank-salary-${from}-to-${to}.xlsx"`,
    },
  });
}