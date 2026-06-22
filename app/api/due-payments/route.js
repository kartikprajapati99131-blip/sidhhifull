import dbConnect from "@/db/connectDb";
import DuePayment from "@/models/DuePayment";
import { NextResponse } from "next/server";

// GET /api/due-payments
// Returns all pending due payments, sorted by nearest due date first.
export async function GET() {
  try {
    await dbConnect();

    const entries = await DuePayment.find({ status: "pending" })
      .sort({ dueDate: 1 })
      .lean();

    return NextResponse.json(
      { success: true, data: entries },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching due payments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch due payments",
        error: error.message,
      },
      { status: 500 }
    );
  }
}