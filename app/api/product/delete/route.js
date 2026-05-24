import connectDB from "@/db/connectDb";
import Product from "@/models/product";
import { requireAdmin } from "@/lib/auth";

export async function POST(req) {
  try {
    await requireAdmin(); // 🔐 protect

    const { id } = await req.json();

    if (!id) {
      return Response.json({ success: false }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
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

    return Response.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}