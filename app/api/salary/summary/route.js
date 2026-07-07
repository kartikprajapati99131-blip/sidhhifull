import connectDb from "@/db/connectDb";
import { requireAdmin } from "@/lib/auth";
import { computeSalarySummary } from "@/lib/salaryCalc";

export async function GET(req) {
  await connectDb();
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || null;

  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo = now.toISOString().split("T")[0];

  const from = searchParams.get("from") || defaultFrom;
  const to = searchParams.get("to") || defaultTo;

  const summary = await computeSalarySummary({ from, to, userId });

  return Response.json({ from, to, data: summary }, { headers: { "Cache-Control": "no-store" } });
}