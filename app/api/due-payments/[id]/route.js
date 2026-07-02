import dbConnect from "@/db/connectDb";
import DuePayment from "@/models/DuePayment";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// GET /api/due-payments/[id]
//
// Returns the full record for a single entry (used by the "detail popup"
// on the pending table so it always has fresh rescheduleHistory /
// amountGiven / etc, instead of relying on whatever the list endpoint
// happened to include).
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid due payment ID" },
        { status: 400 }
      );
    }

    const entry = await DuePayment.findById(id);

    if (!entry) {
      return NextResponse.json(
        { success: false, message: "Due payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: entry },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching due payment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch due payment", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/due-payments/[id]
//
// 1. Normal edit (from the admin table "Edit" button):
//    body: { customerName, amount, dueDate, note, mobile, mobile2, referencedBy }
//    -> updates fields + sets lastEditedAt to now (shows in "Recent Updates" for 4 days)
//
// 2. Follow-up reschedule (from the "Done Calling" popup):
//    body: { isFollowUp: true, dueDate: "<new follow up date>" }
//    -> stores current dueDate in previousDueDate, sets updatedDueDate + lastFollowUpAt
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
    const {
      customerName, amount, dueDate, note, mobile, mobile2, referencedBy,
      isFollowUp, isOnsiteReschedule,
    } = body;

    const existingEntry = await DuePayment.findById(id);

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, message: "Due payment not found" },
        { status: 404 }
      );
    }

    // ── Call reschedule ("Done Calling" popup) ──
    if (isFollowUp) {
      if (!dueDate) {
        return NextResponse.json(
          { success: false, message: "Next follow up date is required" },
          { status: 400 }
        );
      }

      const newDueDate = new Date(dueDate);
      existingEntry.rescheduleHistory.push({
        type: "call",
        previousDueDate: existingEntry.dueDate,
        newDueDate,
      });
      existingEntry.previousDueDate = existingEntry.dueDate;
      existingEntry.updatedDueDate = newDueDate;
      existingEntry.dueDate = newDueDate;
      existingEntry.lastFollowUpAt = new Date();
      existingEntry.lastDueDateChangeAt = new Date();
      existingEntry.reminderShown = false;

      await existingEntry.save();

      return NextResponse.json(
        { success: true, message: "Follow up date updated successfully", data: existingEntry },
        { status: 200 }
      );
    }

    // ── On-site reschedule — behaves like "Done Calling" but also shows in Today's Updates ──
    if (isOnsiteReschedule) {
      if (!dueDate) {
        return NextResponse.json(
          { success: false, message: "New due date is required" },
          { status: 400 }
        );
      }

      const newDueDate = new Date(dueDate);
      existingEntry.rescheduleHistory.push({
        type: "onsite",
        previousDueDate: existingEntry.dueDate,
        newDueDate,
      });
      existingEntry.previousDueDate = existingEntry.dueDate;
      existingEntry.updatedDueDate = newDueDate;
      existingEntry.dueDate = newDueDate;
      existingEntry.lastDueDateChangeAt = new Date();
      existingEntry.lastEditedAt = new Date(); // so it shows in Today's Updates
      existingEntry.reminderShown = false;

      await existingEntry.save();

      return NextResponse.json(
        { success: true, message: "Due date rescheduled on-site", data: existingEntry },
        { status: 200 }
      );
    }

    // ── Regular edit ──
    // Every changed field is logged into editHistory (old -> new, same
    // timestamp) so the Updates screen can show exactly what was changed,
    // instead of just a generic "Fields updated" badge.
    const now = new Date();
    let changed = false;

    const logChange = (field, oldValue, newValue) => {
      existingEntry.editHistory.push({ field, oldValue, newValue, changedAt: now });
    };

    if (customerName !== undefined && customerName.trim() !== existingEntry.customerName) {
      logChange("customerName", existingEntry.customerName, customerName.trim());
      existingEntry.customerName = customerName.trim();
      changed = true;
    }
    if (amount !== undefined && Number(amount) !== existingEntry.amount) {
      logChange("amount", existingEntry.amount, Number(amount));
      existingEntry.amount = Number(amount);
      changed = true;
    }

    if (dueDate !== undefined) {
      const newDate = new Date(dueDate);
      if (newDate.toISOString() !== new Date(existingEntry.dueDate).toISOString()) {
        existingEntry.rescheduleHistory.push({
          type: "onsite",
          previousDueDate: existingEntry.dueDate,
          newDueDate: newDate,
        });
        logChange("dueDate", existingEntry.dueDate, newDate);
        existingEntry.dueDate = newDate;
        existingEntry.lastDueDateChangeAt = now;
        changed = true;
      }
    }
    if (note !== undefined && note !== existingEntry.note) {
      logChange("note", existingEntry.note, note);
      existingEntry.note = note;
      changed = true;
    }
    if (mobile !== undefined && mobile !== existingEntry.mobile) {
      logChange("mobile", existingEntry.mobile, mobile);
      existingEntry.mobile = mobile;
      changed = true;
    }
    if (mobile2 !== undefined && mobile2 !== existingEntry.mobile2) {
      logChange("mobile2", existingEntry.mobile2, mobile2);
      existingEntry.mobile2 = mobile2;
      changed = true;
    }
    if (referencedBy !== undefined && referencedBy !== existingEntry.referencedBy) {
      logChange("referencedBy", existingEntry.referencedBy, referencedBy);
      existingEntry.referencedBy = referencedBy;
      changed = true;
    }

    existingEntry.lastEditedAt = now;

    await existingEntry.save();

    return NextResponse.json(
      { success: true, message: "Due payment updated successfully", data: existingEntry },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating due payment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update due payment", error: error.message },
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