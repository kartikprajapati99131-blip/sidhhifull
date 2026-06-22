import dbConnect from "@/db/connectDb";
import DuePayment from "@/models/DuePayment";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// PUT /api/due-payments/[id]
//
// This route handles two scenarios with one endpoint:
//
// 1. Normal edit (from the admin table "Edit" button):
//    body: { customerName, amount, dueDate, note, mobile }
//    -> updates only the provided fields directly.
//
// 2. Follow-up reschedule (from the "Done Calling" popup):
//    body: { isFollowUp: true, dueDate: "<new follow up date>" }
//    -> stores the current dueDate into previousDueDate,
//       sets updatedDueDate + lastFollowUpAt,
//       and moves dueDate forward to the new follow up date.
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

    const body = await request.json();
    const { customerName, amount, dueDate, note, mobile, isFollowUp } = body;

    const existingEntry = await DuePayment.findById(id);

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, message: "Due payment not found" },
        { status: 404 }
      );
    }

    if (isFollowUp) {
      if (!dueDate) {
        return NextResponse.json(
          { success: false, message: "Next follow up date is required" },
          { status: 400 }
        );
      }

      const newDueDate = new Date(dueDate);

      existingEntry.previousDueDate = existingEntry.dueDate;
      existingEntry.updatedDueDate = newDueDate;
      existingEntry.dueDate = newDueDate;
      existingEntry.lastFollowUpAt = new Date();
      existingEntry.reminderShown = false;

      await existingEntry.save();

      return NextResponse.json(
        {
          success: true,
          message: "Follow up date updated successfully",
          data: existingEntry,
        },
        { status: 200 }
      );
    }

    // Regular edit
    if (customerName !== undefined) existingEntry.customerName = customerName.trim();
    if (amount !== undefined) existingEntry.amount = Number(amount);
    if (dueDate !== undefined) existingEntry.dueDate = new Date(dueDate);
    if (note !== undefined) existingEntry.note = note;
    if (mobile !== undefined) existingEntry.mobile = mobile;

    await existingEntry.save();

    return NextResponse.json(
      {
        success: true,
        message: "Due payment updated successfully",
        data: existingEntry,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating due payment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update due payment",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/due-payments/[id]
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid due payment ID" },
        { status: 400 }
      );
    }

    const deletedEntry = await DuePayment.findByIdAndDelete(id);

    if (!deletedEntry) {
      return NextResponse.json(
        { success: false, message: "Due payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Due payment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting due payment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete due payment",
        error: error.message,
      },
      { status: 500 }
    );
  }
}