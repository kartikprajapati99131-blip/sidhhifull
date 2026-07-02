import dbConnect from "@/db/connectDb";
import DuePayment from "@/models/DuePayment";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// PUT /api/due-payments/[id]/complete
//
// Body: { paymentMethod: "cash"|"check", amountGiven: number,
//         accountStatus: "closed"|"continue", remainingAmount: number }
//
// If accountStatus === "closed":
//   - Deletes the entry entirely (no completed record is kept, any
//     shortfall is written off along with the row itself)
//
// If accountStatus === "continue":
//   - Saves this entry as completed (with amountGiven collected)
//   - Creates a NEW pending entry with the remaining amount
//   - The new entry inherits customerName, mobile, note from the original
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
    const { paymentMethod, amountGiven, accountStatus, remainingAmount } = body;

    if (!paymentMethod || !["cash", "check"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Payment method must be 'cash' or 'check'" },
        { status: 400 }
      );
    }

    if (amountGiven === undefined || amountGiven < 0) {
      return NextResponse.json(
        { success: false, message: "Amount given is required and must be >= 0" },
        { status: 400 }
      );
    }

    if (!accountStatus || !["closed", "continue"].includes(accountStatus)) {
      return NextResponse.json(
        { success: false, message: "Account status must be 'closed' or 'continue'" },
        { status: 400 }
      );
    }

    const existingEntry = await DuePayment.findById(id);
    if (!existingEntry) {
      return NextResponse.json(
        { success: false, message: "Due payment not found" },
        { status: 404 }
      );
    }

    // ── Closed account: purge all data instead of keeping a record ──
    if (accountStatus === "closed") {
      await DuePayment.findByIdAndDelete(id);
      return NextResponse.json(
        {
          success: true,
          message: "Account cleared — all data for this customer has been removed",
          data: null,
          newEntry: null,
        },
        { status: 200 }
      );
    }

    // ── Continue: keep a completed record + spin off a new pending entry ──
    const originalAmount = existingEntry.amount;

    existingEntry.status = "completed";
    existingEntry.completedAt = new Date();
    existingEntry.paymentMethod = paymentMethod;
    existingEntry.amountGiven = Number(amountGiven);
    existingEntry.accountStatus = accountStatus;
    existingEntry.remainingAmount = Number(remainingAmount);
    existingEntry.originalAmount = originalAmount;

    await existingEntry.save();

    let newEntry = null;

    if (remainingAmount > 0) {
      newEntry = await DuePayment.create({
        customerName: existingEntry.customerName,
        amount: Number(remainingAmount),
        dueDate: new Date(), // starts due today — admin can reschedule via follow-up
        mobile: existingEntry.mobile,
        note: `Remaining from partial payment on ${new Date().toLocaleDateString("en-IN")}${existingEntry.note ? ". " + existingEntry.note : ""}`,
        status: "pending",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Partial payment recorded. New entry created for ₹${remainingAmount} remaining.`,
        data: existingEntry,
        newEntry,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error completing due payment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to complete due payment",
        error: error.message,
      },
      { status: 500 }
    );
  }
}