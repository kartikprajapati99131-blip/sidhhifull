import connectDB from "@/db/connectDb";
import Product from "@/models/product";
import { requireAdmin } from "@/lib/auth";

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