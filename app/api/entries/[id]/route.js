// app/api/entries/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ⚠️ adjust to your actual authOptions export path

import dbConnect from "@/db/connectDb";
import Entry, { REFERENCED_BY_OPTIONS } from "@/models/Entry";
import Route from "@/models/Route";
import { CAN_SEE_ALL_ROLES, CAN_SEE_ALL_MISTRY_ROLES, CAN_DELETE_ROLES, serializeEntryWithRoute } from "../route";

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

// Read/edit access for a single entry:
// - admin/subadmin: anything.
// - sales: any customer entry, but only mistry entries they created.
// - everyone else: only entries they created, either type.
function canAccess(session, entry) {
  const role = session.user.role;
  if (CAN_SEE_ALL_MISTRY_ROLES.includes(role)) return true;
  if (CAN_SEE_ALL_ROLES.includes(role)) {
    if (entry.type === "customer") return true;
    return entry.createdBy?.id === session.user.id;
  }
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

    const entry = await Entry.findById(id).populate("route", "name");
    if (!entry) {
      return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
    }
    if (!canAccess(session, entry)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: serializeEntryWithRoute(entry) }, { status: 200 });
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

    // Route is handled separately from EDITABLE_FIELDS because it's a
    // reference (ObjectId), not a plain string: it needs its own
    // validation and a name lookup so the change-history line reads like
    // "Route: "Deesa Highway" → "Abu Highway"" instead of showing raw IDs.
    // An empty string / null clears the route.
    if (body.route !== undefined) {
      let newRouteId = null;
      if (body.route) {
        if (!mongoose.Types.ObjectId.isValid(body.route)) {
          return NextResponse.json({ success: false, message: "Invalid route" }, { status: 400 });
        }
        newRouteId = body.route;
      }
      const oldRouteId = entry.route ? entry.route.toString() : null;
      if (newRouteId !== oldRouteId) {
        const [oldRouteDoc, newRouteDoc] = await Promise.all([
          oldRouteId ? Route.findById(oldRouteId).select("name") : null,
          newRouteId ? Route.findById(newRouteId).select("name") : null,
        ]);
        changeLines.push(`Route: "${oldRouteDoc?.name || "—"}" → "${newRouteDoc?.name || "—"}"`);
        entry.route = newRouteId;
      }
    }

    // Referenced By — handled separately from EDITABLE_FIELDS (like
    // Route) because it's restricted to the fixed REFERENCED_BY_OPTIONS
    // list and needs its own validation rather than a free-text trim.
    if (body.referencedBy !== undefined) {
      const newValue = body.referencedBy?.trim() || "";
      if (newValue && !REFERENCED_BY_OPTIONS.includes(newValue)) {
        return NextResponse.json({ success: false, message: "Invalid Referenced By value" }, { status: 400 });
      }
      const oldValue = entry.referencedBy || "";
      if (newValue !== oldValue) {
        changeLines.push(`Referenced By: "${oldValue || "—"}" → "${newValue || "—"}"`);
        entry.referencedBy = newValue;
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
    if (entry.route) {
      await entry.populate("route", "name");
    }

    return NextResponse.json(
      { success: true, message: "Entry updated successfully", data: serializeEntryWithRoute(entry) },
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
// Only admin/subadmin can delete — staff (including sales) can edit their
// own mistakes but not remove records outright. NOTE: this now checks
// CAN_DELETE_ROLES, not CAN_SEE_ALL_ROLES — under the old code sales was
// in CAN_SEE_ALL_ROLES and could delete ANY entry via a direct API call,
// even though the delete button was hidden from them in the UI.
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (!CAN_DELETE_ROLES.includes(session.user.role)) {
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