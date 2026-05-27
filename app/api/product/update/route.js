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

    // If images are being updated, ensure at least one is provided
    if (data.images !== undefined) {
      if (!Array.isArray(data.images) || data.images.length === 0) {
        return Response.json(
          { success: false, message: "Product must have at least one image." },
          { status: 400 }
        );
      }
      for (const img of data.images) {
        if (!img.url) {
          return Response.json(
            { success: false, message: "Each image must have a valid URL." },
            { status: 400 }
          );
        }
      }
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