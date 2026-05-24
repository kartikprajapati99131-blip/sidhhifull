import connectDB from "@/db/connectDb";
import Product from "@/models/product";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req) {
  try {
    await requireAdmin(); // 🔐 protect

    const { id, data } = await req.json();

    if (!id) {
      return Response.json(
        { success: false, message: "Product ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    const updated = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return Response.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      product: {
        ...updated._doc,
        _id: updated._id.toString(),
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