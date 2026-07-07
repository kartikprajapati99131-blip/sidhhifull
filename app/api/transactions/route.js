import connectDb from "@/db/connectDb";
import Transaction from "@/models/Transaction";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  await connectDb();
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const query = { userId };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }

  const transactions = await Transaction.find(query).sort({ date: -1 }).lean();

  return Response.json(transactions, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  await connectDb();
  await requireAdmin();

  const body = await req.json();
  const { userId, date, type, amount, remark } = body;

  if (!userId || !date || !type || amount === undefined) {
    return Response.json({ error: "userId, date, type and amount are required" }, { status: 400 });
  }
  if (!["credit", "debit"].includes(type)) {
    return Response.json({ error: "type must be credit or debit" }, { status: 400 });
  }
  if (isNaN(amount) || amount <= 0) {
    return Response.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  const transaction = await Transaction.create({
    userId,
    date,
    type,
    amount,
    remark: remark || "",
  });

  return Response.json({ message: "Added", transaction });
}