import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import connectDB from "@/db/connectDb";
import Order from "@/models/order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    // 🔐 require logged-in user
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ success: false }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();

    const existingOrder = await Order.findOne({
      razorpayOrderId: body.razorpay_order_id,
    });

    if (!existingOrder) {
      return Response.json({ success: false }, { status: 404 });
    }

    // 🔐 ensure user owns this order
    if (existingOrder.userId.toString() !== session.user.id) {
      return Response.json({ success: false }, { status: 403 });
    }

    // already paid
    if (existingOrder.status === "paid") {
      return Response.json({
        success: true,
        message: "Already paid",
      });
    }

    const isValid = validatePaymentVerification(
      {
        order_id: body.razorpay_order_id,
        payment_id: body.razorpay_payment_id,
      },
      body.razorpay_signature,
      process.env.KEY_SECRET
    );

    if (!isValid) {
      await Order.findOneAndUpdate(
        { razorpayOrderId: body.razorpay_order_id },
        { status: "failed" }
      );

      return Response.json({ success: false }, { status: 400 });
    }

    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: body.razorpay_order_id },
      {
        status: "paid",
        paymentId: body.razorpay_payment_id,
      },
      { new: true }
    );

    return Response.json({ success: true, order });

  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}