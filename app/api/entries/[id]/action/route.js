import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ⚠️ adjust to your actual authOptions export path

import dbConnect from "@/db/connectDb";
import Entry, { VISIT_TAGS } from "@/models/Entry";
import { CAN_SEE_ALL_ROLES, CAN_SEE_ALL_MISTRY_ROLES, serializeEntryWithRoute } from "../../route";

// "visited" is a new action: log a site visit with a remark and an
// optional Sittos/Magnus/CPL tag selection, without changing status.
const ACTIONS = ["call", "onsite", "visited", "cancel", "site-confirm"];

// Only these two actions collect Sittos/Magnus/CPL tags.
const TAG_ACTIONS = ["site-confirm", "visited"];

// Same access rule as app/api/entries/[id]/route.js:
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

// POST /api/entries/[id]/action
// body: { action: "call" | "onsite" | "visited" | "cancel" | "site-confirm", text, nextMeetingDate, tags }
// Logs a history entry and, for cancel/site-confirm, updates status.
// Call/on-site can optionally set a new next-meeting date. Site-confirm and
// visited can optionally carry a multi-select of Sittos/Magnus/CPL tags —
// those get stamped on the history entry AND merged (unioned) onto the
// entry's own `tags` field, which is what the tag filter reads.
export async function POST(request, { params }) {
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
    const { action, text, nextMeetingDate, tags: rawTags } = body || {};

    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }
    if (action === "cancel" && !text?.trim()) {
      return NextResponse.json({ success: false, message: "A reason is required to cancel" }, { status: 400 });
    }
    if (entry.status === "cancelled") {
      return NextResponse.json({ success: false, message: "This entry is already cancelled" }, { status: 400 });
    }

    // Sanitize tags: only accept known values, and only for the two actions
    // that support them — silently drop anything else so a bad client
    // payload can't inject arbitrary strings into `tags`.
    const tags =
      TAG_ACTIONS.includes(action) && Array.isArray(rawTags)
        ? rawTags.filter((t) => VISIT_TAGS.includes(t))
        : [];

    entry.history.push({
      type: action,
      text: text?.trim() || "",
      tags,
      by: { id: session.user.id, name: session.user.name || "Unknown", role: session.user.role || "staff" },
      at: new Date(),
    });
    // Subdocument array pushes are auto-tracked, but mark it explicitly too —
    // cheap insurance against this silently not persisting.
    entry.markModified("history");

    if (action === "cancel") entry.status = "cancelled";
    if (action === "site-confirm") entry.status = "site-confirmed";
    if ((action === "call" || action === "onsite") && nextMeetingDate) {
      entry.nextMeetingDate = nextMeetingDate;
    }
    if (TAG_ACTIONS.includes(action) && tags.length) {
      // Union this action's tags into the entry's cumulative tag list, so
      // the tag filter (and the next time this modal opens) sees them.
      const merged = Array.from(new Set([...(entry.tags || []), ...tags]));
      entry.tags = merged;
      entry.markModified("tags"); // belt-and-suspenders for the same reason as above
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
    console.error("Error applying entry action:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update entry", error: error.message },
      { status: 500 }
    );
  }
}