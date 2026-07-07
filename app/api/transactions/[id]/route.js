import connectDb from "@/db/connectDb";
import Transaction from "@/models/Transaction";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(req, { params }) {
  await connectDb();
  await requireAdmin();

  const { id } = await params;
  const deleted = await Transaction.findByIdAndDelete(id);

  if (!deleted) {
    return Response.json({ error: "Transaction not found" }, { status: 404 });
  }

  return Response.json({ message: "Deleted" });
}