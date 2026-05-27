import connectDB from "@/db/connectDb";
import Product from "@/models/product";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    let query = {};
    if (type) {
      query.type = type;
    }

    const products = await Product.find(query).lean();

    return Response.json(
      products.map((item) => ({
        ...item,
        _id: item._id.toString(),
        // ✅ FIX: .lean() bypasses the toJSON transform on the model, so old
        // DB documents that predate the `images` field come back with
        // images=undefined. Normalize to [] so every consumer gets a safe array.
        images: Array.isArray(item.images) ? item.images : [],
      }))
    );

  } catch (err) {
    if (err.message === "UNAUTHORIZED") {
      return Response.json({ success: false }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return Response.json({ success: false }, { status: 403 });
    }
    return Response.json([], { status: 500 });
  }
}
