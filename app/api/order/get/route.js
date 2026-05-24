import connectDB from "@/db/connectDb";
import Order from "@/models/order";
import { requireAdmin } from "@/lib/auth";  

export async function GET() {
  try {
    await requireAdmin();

    await connectDB();

    const data = await Order.find().sort({ createdAt: -1 }).lean();

    const sorted = data.sort((a, b) => {
      if (a.status === "paid" && b.status !== "paid") return -1;
      if (a.status !== "paid" && b.status === "paid") return 1;
      return 0;
    });

    return Response.json(
      sorted.map((item) => ({
        ...item,
        _id: item._id.toString(),
      }))
    );

  } catch (err) {
    if (err.message === "UNAUTHORIZED") {
      return Response.json({ success: false }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return Response.json({ success: false }, { status: 403 });
    }

    return Response.json({ success: false }, { status: 500 });
  }
}