import dbConnect from "@/db/connectDb";
import Complaint, { STATUSES, PRODUCTS, ASSIGNEES } from "@/models/Complaint";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// GET /api/complaints/[id]
// Full record including history, for the detail view.
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid complaint ID" },
        { status: 400 }
      );
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return NextResponse.json(
        { success: false, message: "Complaint not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: complaint }, { status: 200 });
  } catch (error) {
    console.error("Error fetching complaint:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch complaint", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/complaints/[id]
//
// 1. Field edit (from the "Edit" action in the row dropdown):
//    body: { isEdit: true, customerName, mobileNumber, address, product, assignedTo, followUpDate }
//    -> updates the editable fields, bumps lastUpdatedAt (shows in Today's Updates)
//
// 2. Status action (Complete / Need Visit / Follow Up / Call-Site):
//    body: { status, remark, followUpDate? }
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid complaint ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return NextResponse.json(
        { success: false, message: "Complaint not found" },
        { status: 404 }
      );
    }

    // ── Field edit ──
    if (body.isEdit) {
      const { customerName, mobileNumber, address, product, assignedTo, followUpDate, actorName } = body;

      if (!customerName?.trim() || !mobileNumber?.trim() || !address?.trim()) {
        return NextResponse.json(
          { success: false, message: "Customer name, mobile number and address are required" },
          { status: 400 }
        );
      }

      if (!/^\d{10}$/.test(mobileNumber.trim())) {
        return NextResponse.json(
          { success: false, message: "Mobile number must be exactly 10 digits" },
          { status: 400 }
        );
      }

      if (!PRODUCTS.includes(product)) {
        return NextResponse.json(
          { success: false, message: "Invalid product" },
          { status: 400 }
        );
      }

      if (!ASSIGNEES.includes(assignedTo)) {
        return NextResponse.json(
          { success: false, message: "Invalid assignee" },
          { status: 400 }
        );
      }

      if (!followUpDate) {
        return NextResponse.json(
          { success: false, message: "Follow-up date is required" },
          { status: 400 }
        );
      }

      complaint.customerName = customerName.trim();
      complaint.mobileNumber = mobileNumber.trim();
      complaint.address = address.trim();
      complaint.product = product;
      complaint.assignedTo = assignedTo;
      complaint.followUpDate = new Date(followUpDate);
      complaint.lastUpdatedAt = new Date();
      complaint.lastUpdatedBy = actorName?.trim() || "Unknown User";

      await complaint.save();

      return NextResponse.json(
        { success: true, message: "Complaint updated successfully", data: complaint },
        { status: 200 }
      );
    }

    // ── Status action ──
    const { status, remark, followUpDate, actorName } = body;
    const actor = actorName?.trim() || "Unknown User";

    if (!STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    if (!remark?.trim()) {
      return NextResponse.json(
        { success: false, message: "Remark is required" },
        { status: 400 }
      );
    }

    if (status === "follow-up" && !followUpDate) {
      return NextResponse.json(
        { success: false, message: "Follow-up date is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const trimmedRemark = remark.trim();
    const newFollowUpDate = status === "follow-up" ? new Date(followUpDate) : null;

    complaint.history.push({
      status,
      remark: trimmedRemark,
      followUpDate: newFollowUpDate,
      at: now,
      updatedBy: actor,
    });

    complaint.status = status;
    complaint.remark = trimmedRemark;
    complaint.followUpDate = newFollowUpDate;
    complaint.lastUpdatedAt = now;
    complaint.lastUpdatedBy = actor;

    if (status === "completed") {
      complaint.completedAt = now;
      complaint.completedBy = actor;
      complaint.followUpDate = null;
    } else {
      complaint.completedAt = null;
      complaint.completedBy = null;
    }

    await complaint.save();

    return NextResponse.json(
      { success: true, message: "Complaint updated successfully", data: complaint },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating complaint:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update complaint", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/complaints/[id]
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid complaint ID" },
        { status: 400 }
      );
    }

    const deleted = await Complaint.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Complaint not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Complaint deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting complaint:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete complaint", error: error.message },
      { status: 500 }
    );
  }
}