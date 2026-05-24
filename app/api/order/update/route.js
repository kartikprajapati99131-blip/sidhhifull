import connectDB from "@/db/connectDb";
import Order from "@/models/order";
import { requireAdmin } from "@/lib/auth";

export async function POST(req) {
  try {
    await requireAdmin(); // 🔐 protect

    await connectDB();

    const { id, deliveryStatus } = await req.json();

    if (!id || !deliveryStatus) {
      return Response.json({ success: false }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { deliveryStatus },
      { new: true }
    );

    if (!order) {
      return Response.json({ success: false }, { status: 404 });
    }

    return Response.json({ success: true });

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