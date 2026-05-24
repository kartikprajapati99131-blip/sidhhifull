import connectDB from "@/db/connectDb";
import Contact from "@/models/contact";
import { requireAdmin } from "@/lib/auth";

export async function DELETE() {
  try {
    await requireAdmin(); // 🔐 protect

    await connectDB();

    await Contact.deleteMany({});

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