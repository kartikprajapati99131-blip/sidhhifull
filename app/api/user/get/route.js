import connectDB from "@/db/connectDb";
import User from "@/models/user";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin(); // 🔐 protect

    await connectDB();

    const data = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json(
      data.map((item) => ({
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