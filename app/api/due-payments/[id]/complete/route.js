import dbConnect from "@/db/connectDb";
import DuePayment from "@/models/DuePayment";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// PUT /api/due-payments/[id]/complete
// Marks an entry as completed. Completed entries never appear in the
// reminder popup or pending table again.
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid due payment ID" },
        { status: 400 }
      );
    }

    const updatedEntry = await DuePayment.findByIdAndUpdate(
      id,
      {
        status: "completed",
        completedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedEntry) {
      return NextResponse.json(
        { success: false, message: "Due payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Due payment marked as completed",
        data: updatedEntry,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error completing due payment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark due payment as completed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}