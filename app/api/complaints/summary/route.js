import dbConnect from "@/db/connectDb";
import Complaint from "@/models/Complaint";
import { NextResponse } from "next/server";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// GET /api/complaints/summary
// Combined endpoint for the reminders popup + tabs:
//   todayUpdates     — lastUpdatedAt is today
//   todayDue         — active, followUpDate is today
//   last7DaysPending — active, followUpDate in the last 7 days (not today)
//   nonVisiting      — active, lastUpdatedAt older than 7 days
export async function GET() {
  try {
    await dbConnect();

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);

    const [todayUpdates, todayDue, last7DaysPending, nonVisiting] = await Promise.all([
      Complaint.find({ lastUpdatedAt: { $gte: todayStart, $lte: todayEnd } })
        .sort({ lastUpdatedAt: -1 })
        .lean(),
      Complaint.find({
        status: { $ne: "completed" },
        followUpDate: { $gte: todayStart, $lte: todayEnd },
      })
        .sort({ followUpDate: 1 })
        .lean(),
      Complaint.find({
        status: { $ne: "completed" },
        followUpDate: { $gte: sevenDaysAgo, $lt: todayStart },
      })
        .sort({ followUpDate: 1 })
        .lean(),
      Complaint.find({
        status: { $ne: "completed" },
        lastUpdatedAt: { $lte: sevenDaysAgo },
      })
        .sort({ lastUpdatedAt: 1 })
        .lean(),
    ]);

    return NextResponse.json(
      { success: true, data: { todayUpdates, todayDue, last7DaysPending, nonVisiting } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching complaint summary:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch complaint summary", error: error.message },
      { status: 500 }
    );
  }
}
