import { withAdmin } from "@/lib/withAdmin";
import connectDB from "@/db/connectDb";
import Order from "@/models/order";

export const POST = withAdmin(async (req) => {
  await connectDB();

  const { id } = await req.json();

  if (!id) {
    return Response.json({ success: false }, { status: 400 });
  }

  const order = await Order.findByIdAndDelete(id);

  if (!order) {
    return Response.json({ success: false }, { status: 404 });
  }

  return Response.json({ success: true });
});