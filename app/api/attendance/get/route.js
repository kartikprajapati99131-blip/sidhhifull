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

    // Fetch ALL users — no role filter
    const users = await User.find().select("_id name email role").lean();

    // Build a map for O(1) lookup
    const userMap = {};
    for (const u of users) {
      userMap[u._id.toString()] = u;
    }

    const result = attendance
      .map((att) => {
        const user = userMap[att.userId];
        // If user no longer exists or is not staff, skip this record
        if (!user || user.role !== "staff") return null;
        return {
          ...att,
          userName: user.name,
          email: user.email,
          role: user.role,
        };
      })
      .filter(Boolean); // remove nulls

    return Response.json(result);
  }

  // Individual user view
  const attendance = await Attendance.find({ userId }).lean();
  return Response.json(attendance);
}