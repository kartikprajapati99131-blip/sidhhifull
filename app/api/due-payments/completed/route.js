import dbConnect from "@/db/connectDb";
import DuePayment from "@/models/DuePayment";
import { NextResponse } from "next/server";

// GET /api/due-payments/completed
// Returns all completed due payments, sorted by most recently completed first.
// Used by RecoveredSummary component for the timeline/filter view.
export async function GET() {
  try {
    await dbConnect();

    const entries = await DuePayment.find({ status: "completed" })
      .sort({ completedAt: -1 })
      .lean();

    return NextResponse.json(
      { success: true, data: entries },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching completed payments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch completed payments",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
