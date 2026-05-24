import connectDB from "@/db/connectDb";
import Order from "@/models/order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // 🔐 not logged in → return empty
    if (!session || !session.user?.id) {
      return Response.json([]);
    }

    await connectDB();

    const orders = await Order.find({
      userId: session.user.id,
    })
      .sort({ createdAt: -1 })
      .lean(); // 🔥 better performance

    return Response.json(
      orders.map((item) => ({
        ...item,
        _id: item._id.toString(),
      }))
    );

  } catch (error) {
    console.error("API ERROR:", error);
    return Response.json([]);
  }
}