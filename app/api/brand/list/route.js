// app/api/brand/list/route.js
import connectDB from "@/db/connectDb";
import Brand from "@/models/brand";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const query = type ? { type } : {};
    const brands = await Brand.find(query).sort({ createdAt: -1 }).lean();

    return Response.json({
      success: true,
      brands: brands.map((b) => ({ ...b, _id: b._id.toString() })),
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}