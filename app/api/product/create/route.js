import connectDB from "@/db/connectDb";
import Product from "@/models/product";
import { requireAdmin } from "@/lib/auth";

export async function POST(req) {
  try {
    await requireAdmin(); // 🔐 admin only

    await connectDB();

    const body = await req.json();

    // Validate that at least one image is provided
    const hasImages = Array.isArray(body.images) && body.images.length > 0;
    if (!hasImages) {
      return Response.json(
        { success: false, message: "Please upload at least one product image." },
        { status: 400 }
      );
    }

    // Validate each image has a url
    for (const img of body.images) {
      if (!img.url) {
        return Response.json(
          { success: false, message: "Each image must have a valid URL." },
          { status: 400 }
        );
      }
    }

    // Validate variants only if provided — variant-mode types enforce
    // this on the frontend already; simple-mode types intentionally
    // send no variants at all.
    if (body.variants) {
      if (!Array.isArray(body.variants)) {
        return Response.json(
          { success: false, message: "Variants must be an array." },
          { status: 400 }
        );
      }
      for (const v of body.variants) {
        if (!v.label) {
          return Response.json(
            { success: false, message: "Each variant needs a label." },
            { status: 400 }
          );
        }
      }
    }

    // Price is not part of this product model — strip it if it ever shows up
    delete body.price;
    delete body.priceUnit;

    // Sanitize tags — only allow known values
    const ALLOWED_TAGS = ["best_seller", "featured", "new_arrival"];
    if (body.tags) {
      body.tags = body.tags.filter((t) => ALLOWED_TAGS.includes(t));
    }

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

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const tag = searchParams.get("tag");

    const filter = {};
    if (type) filter.type = type;
    if (tag) filter.tags = tag;

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return Response.json({ success: true, products });
  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}