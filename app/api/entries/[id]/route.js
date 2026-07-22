// app/api/entries/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ⚠️ adjust to your actual authOptions export path

import dbConnect from "@/db/connectDb";
import Entry from "@/models/Entry";
import { serializeEntry } from "@/lib/serializeEntry";
import { CAN_SEE_ALL_ROLES } from "../route";

const EDITABLE_FIELDS = [
  "mobile1",
  "mobile2",
  "name",
  "siteAddress",
  "permanentAddress",
  "profession",
  "mistryName",
  "mistryNumber",
  "architectName",
  "architectNumber",
  "nextMeetingDate",
];

// Human-readable labels used to build the "what changed" summary stored on
// the edit's history entry — this is what shows up in the detail popup's
// History list and in Today's Updates.
const FIELD_LABELS = {
  mobile1: "Mobile No 1",
  mobile2: "Mobile No 2",
  name: "Name",
  siteAddress: "Site Address",
  permanentAddress: "Permanent Address",
  profession: "Profession",
  mistryName: "Mistry Name",
  mistryNumber: "Mistry Number",
  architectName: "Architect Name",
  architectNumber: "Architect Number",
  nextMeetingDate: "Next meeting date",
};

// A staff member may only read/edit entries they created themselves.
// admin & sales can touch anything.
function canAccess(session, entry) {
  if (CAN_SEE_ALL_ROLES.includes(session.user.role)) return true;
  return entry.createdBy?.id === session.user.id;
}

// GET /api/entries/[id]
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid entry ID" }, { status: 400 });
    }

    const entry = await Entry.findById(id);
    if (!entry) {
      return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
    }
    if (!canAccess(session, entry)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: serializeEntry(entry) }, { status: 200 });
  } catch (error) {
    console.error("Error fetching entry:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch entry", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/entries/[id]
// Regular field edit. Builds an exact "field: old → new" summary of every
// changed field and stores it as the text on a single "edit" history
// entry, so the popup and Today's Updates show precisely what was changed
// instead of a generic "Details updated" message.
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid entry ID" }, { status: 400 });
    }

    const entry = await Entry.findById(id);
    if (!entry) {
      return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
    }
    if (!canAccess(session, entry)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }
    if (body.mobile1 !== undefined && !body.mobile1.trim()) {
      return NextResponse.json({ success: false, message: "Mobile No 1 is required" }, { status: 400 });
    }
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });
    }

    const changeLines = [];
    for (const field of EDITABLE_FIELDS) {
      if (body[field] === undefined) continue;
      const value = typeof body[field] === "string" ? body[field].trim() : body[field];
      const oldValue = entry[field] || "";
      if (value !== oldValue) {
        const label = FIELD_LABELS[field] || field;
        changeLines.push(`${label}: "${oldValue || "—"}" → "${value || "—"}"`);
        entry[field] = value;
      }
    }

    const changed = changeLines.length > 0;
    if (changed) {
      entry.history.push({
        type: "edit",
        text: changeLines.join("; "),
        tags: [],
        by: { id: session.user.id, name: session.user.name || "Unknown", role: session.user.role || "staff" },
        at: new Date(),
      });
    }

    await entry.save();

    return NextResponse.json(
      { success: true, message: "Entry updated successfully", data: serializeEntry(entry) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating entry:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update entry", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/entries/[id]
// Only admin/subadmin can delete — staff can edit their own mistakes but
// not remove records outright.
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (!CAN_SEE_ALL_ROLES.includes(session.user.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid entry ID" }, { status: 400 });
    }

    const deleted = await Entry.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Entry deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting entry:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete entry", error: error.message },
      { status: 500 }
    );
  }
}