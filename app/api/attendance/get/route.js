import connectDb from "@/db/connectDb";
import Attendance from "@/models/Attendance";
import User from "@/models/user";
import { requireAdmin } from "@/lib/auth";

// api/attendance/get/route.js
export async function GET(req) {
  await connectDb();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // Admin view — no userId param
  if (!userId) {
    await requireAdmin();
    const attendance = await Attendance.find().lean();
    const users = await User.find().lean();

    const result = attendance.map((att) => {
      const user = users.find((u) => u._id.toString() === att.userId);
      return { ...att, userName: user?.name || "Unknown", email: user?.email || "" };
    });

    return Response.json(result);
  }

  // Individual user view
  const attendance = await Attendance.find({ userId }).lean();
  return Response.json(attendance);
}