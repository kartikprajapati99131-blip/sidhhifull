// app/api/entries/[id]/action/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ⚠️ adjust to your actual authOptions export path

import dbConnect from "@/db/connectDb";
import Entry from "@/models/Entry";
import { serializeEntry } from "@/lib/serializeEntry";
import { CAN_SEE_ALL_ROLES } from "../../route";

const ACTIONS = ["call", "onsite", "cancel", "site-confirm"];

function canAccess(session, entry) {
  if (CAN_SEE_ALL_ROLES.includes(session.user.role)) return true;
  return entry.createdBy?.id === session.user.id;
}

// POST /api/entries/[id]/action
// body: { action: "call" | "onsite" | "cancel" | "site-confirm", text, nextMeetingDate }
// Logs a history entry and, for cancel/site-confirm, updates status.
// Call/on-site can optionally set a new next-meeting date.
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
    const { action, text, nextMeetingDate } = body || {};

    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }
    if (action === "cancel" && !text?.trim()) {
      return NextResponse.json({ success: false, message: "A reason is required to cancel" }, { status: 400 });
    }
    if (entry.status === "cancelled") {
      return NextResponse.json({ success: false, message: "This entry is already cancelled" }, { status: 400 });
    }

    entry.history.push({
      type: action,
      text: text?.trim() || "",
      by: { id: session.user.id, name: session.user.name || "Unknown", role: session.user.role || "staff" },
      at: new Date(),
    });

    if (action === "cancel") entry.status = "cancelled";
    if (action === "site-confirm") entry.status = "site-confirmed";
    if ((action === "call" || action === "onsite") && nextMeetingDate) {
      entry.nextMeetingDate = nextMeetingDate;
    }

    await entry.save();

    return NextResponse.json(
      { success: true, message: "Entry updated successfully", data: serializeEntry(entry) },
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
