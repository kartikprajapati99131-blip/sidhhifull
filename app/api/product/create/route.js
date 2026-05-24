import connectDB from "@/db/connectDb";
import Product from "@/models/product";
import { requireAdmin } from "@/lib/auth";

export async function POST(req) {
  try {
    await requireAdmin(); // 🔐 protect (admin only)

    await connectDB();

    const body = await req.json();

    const product = await Product.create(body);

    return Response.json({
      success: true,
      product: {
        ...product._doc,
        _id: product._id.toString(),
      },
    });

  } catch (err) {
    if (err.message === "UNAUTHORIZED") {
      return Response.json({ success: false }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return Response.json({ success: false }, { status: 403 });
    }

    return Response.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}