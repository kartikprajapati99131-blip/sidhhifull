import dbConnect from "@/db/connectDb";
import DuePayment from "@/models/DuePayment";
import { NextResponse } from "next/server";

// GET /api/due-payments/today
// Returns all PENDING entries whose due date is today or earlier (overdue).
export async function GET() {
  try {
    await dbConnect();

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const entries = await DuePayment.find({
      status: "pending",
      dueDate: { $lte: endOfToday },
    })
      .sort({ dueDate: 1 })
      .lean();

    return NextResponse.json(
      { success: true, data: entries },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching today's due payments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch today's due payments",
        error: error.message,
      },
      { status: 500 }
    );
  }
}