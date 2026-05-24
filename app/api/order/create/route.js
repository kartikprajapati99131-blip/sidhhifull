import Razorpay from "razorpay";
import connectDB from "@/db/connectDb";
import Order from "@/models/order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    // 🔐 require logged-in user (NOT admin)
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ success: false }, { status: 401 });
    }

    await connectDB();

    const { cart, total, address } = await req.json();

    const razorpay = new Razorpay({
      key_id: process.env.KEY_ID,
      key_secret: process.env.KEY_SECRET,
    });

    const options = {
      amount: total * 100,
      currency: "INR",
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const order = await Order.create({
      userId: session.user.id, // 🔥 use session (NOT frontend)
      cartItems: cart,
      amount: total,
      address,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
      deliveryStatus: "pending",
    });

    return Response.json({
      success: true,
      orderId: razorpayOrder.id,
      dbOrderId: order._id,
    });

  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}