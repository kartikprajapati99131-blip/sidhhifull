import dbConnect from "@/db/connectDb";
import DuePayment from "@/models/DuePayment";
import { NextResponse } from "next/server";

// GET /api/due-payments/no-answer
// Pending entries whose dueDate is 7 or more days in the past.
// e.g. today = 02 Jul 2026 -> anything with dueDate on/before 25 Jun 2026.
export async function GET() {
  try {
    await dbConnect();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    cutoff.setHours(23, 59, 59, 999); // end of that day — inclusive of "exactly 7 days ago"

    const entries = await DuePayment.find({
      status: "pending",
      dueDate: { $lte: cutoff },
    })
      .sort({ dueDate: 1 })
      .lean();

    return NextResponse.json({ success: true, data: entries }, { status: 200 });
  } catch (error) {
    console.error("Error fetching no-answer payments:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch no-answer payments", error: error.message },
      { status: 500 }
    );
  }
}