import connectDB from "@/db/connectDb";
import contact from "@/models/contact";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin(); // 🔐 protect

    await connectDB();

    const data = await contact.find().sort({ createdAt: -1 });

    return Response.json(
      data.map((item) => ({
        ...item._doc,
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