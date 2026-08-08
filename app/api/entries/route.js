// app/api/entries/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import dbConnect from "@/db/connectDb";
import Entry from "@/models/Entry";
import { serializeEntry } from "@/lib/serializeEntry";

// Roles allowed to see every CUSTOMER entry, not just their own — keep
// this in sync with app/entries/followup/page.js and the [id] routes.
export const CAN_SEE_ALL_ROLES = ["admin", "sales", "subadmin"];

// Roles allowed to see every MISTRY entry (added by anyone). Sales is
// deliberately excluded from the GENERAL rule: sales sees all customers,
// but only the Mistry entries they personally created — EXCEPT for
// overdue entries, which sales can always see regardless of owner (see
// the "overdue override" clause in GET below).
export const CAN_SEE_ALL_MISTRY_ROLES = ["admin", "subadmin"];

// Roles allowed to delete entries — separate from CAN_SEE_ALL_ROLES on
// purpose. Sales can view/add/edit but must NEVER be able to delete,
// even via a direct API call.
export const CAN_DELETE_ROLES = ["admin", "subadmin"];

// Only these roles may hit this endpoint at all. Anyone else (even if
// authenticated) gets a 403 — this is a stricter gate than the visibility
// filtering below, which decides *which* entries a given role can see.
export const ALLOWED_ENTRY_ROLES = ["admin", "subadmin", "sales", "staff"];

// Must match NOT_VISITED_AFTER_DAYS in the EntryManager component — an
// entry counts as "overdue" (as opposed to just "due") once it's pending
// and more than this many days past its nextMeetingDate. Keep these two
// values in sync; consider moving both to a shared constants file.
const NOT_VISITED_AFTER_DAYS = 5;

// "YYYY-MM-DD" string for the cutoff date: any pending entry whose
// nextMeetingDate is on or before this date counts as overdue. Since
// nextMeetingDate is stored as a plain "YYYY-MM-DD" string, lexical
// comparison ($lte) works the same as date comparison.
function overdueCutoffDateStr() {
  const today = new Date();
  const cutoff = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (NOT_VISITED_AFTER_DAYS + 1))
  );
  return cutoff.toISOString().slice(0, 10);
}

// GET /api/entries
// admin & subadmin -> every entry, of both types.
// sales             -> every customer entry, every OVERDUE entry
//                       regardless of type/owner (special override — this
//                       is the one case where sales sees a mistry entry
//                       they didn't create), and otherwise only the
//                       mistry entries they created themselves.
// staff             -> only entries they created (either type).
// anyone else       -> 403 Forbidden, no data at all.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;

    if (!ALLOWED_ENTRY_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: your role cannot access entries" },
        { status: 403 }
      );
    }

    await dbConnect();

    const seesAllMistry = CAN_SEE_ALL_MISTRY_ROLES.includes(role);
    const seesAllCustomers = CAN_SEE_ALL_ROLES.includes(role);

    let filter;
    if (seesAllMistry) {
      // admin / subadmin: no restrictions at all.
      filter = {};
  } else if (seesAllCustomers) {
      // sales: sees every CUSTOMER entry regardless of owner, but only
      // the MISTRY entries they personally created. No more cross-owner
      // override for overdue mistry entries — overdueCutoffDateStr() is
      // kept in this file for reuse elsewhere, just not used here anymore.
      filter = {
        $or: [
          { type: "customer" },
          { type: "mistry", "createdBy.id": session.user.id },
        ],
      };
    } else {
      // staff (or any other allowed-but-unprivileged role): only their
      // own entries, regardless of type.
      filter = { "createdBy.id": session.user.id };
    }

    const docs = await Entry.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, data: docs.map(serializeEntry) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching entries:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch entries", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/entries
// Everyone can create an entry for themselves. If the mobile number already
// matches a pending entry, the caller gets a warning back and must resend
// with `force: true` to create it anyway — same pattern as due-payments.
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !["customer", "mistry"].includes(body.type)) {
      return NextResponse.json({ success: false, message: "Invalid entry type" }, { status: 400 });
    }
    if (!body.mobile1?.trim() || !body.name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Mobile No 1 and name are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const mobile1 = body.mobile1.trim();
    const mobile2 = body.mobile2?.trim() || "";

    if (!body.force) {
      const existingPending = await Entry.findOne({
        status: "pending",
        $or: [
          { mobile1 },
          ...(mobile2 ? [{ mobile1: mobile2 }, { mobile2: mobile1 }, { mobile2 }] : []),
        ],
      });

      if (existingPending) {
        return NextResponse.json(
          {
            success: false,
            duplicate: true,
            message: `A pending entry already exists for this mobile number (${existingPending.name}). Save anyway?`,
            existingEntry: serializeEntry(existingPending),
          },
          { status: 409 }
        );
      }
    }

    const actor = {
      id: session.user.id,
      name: session.user.name || "Unknown",
      role: session.user.role || "staff",
    };

    const doc = await Entry.create({
      type: body.type,
      mobile1,
      mobile2,
      name: body.name.trim(),
      siteAddress: body.siteAddress,
      permanentAddress: body.permanentAddress,
      profession: body.profession,
      mistryName: body.mistryName,
      mistryNumber: body.mistryNumber,
      architectName: body.architectName,
      architectNumber: body.architectNumber,
      nextMeetingDate: body.nextMeetingDate,
      status: "pending",
      createdBy: actor,
      history: body.remark?.trim()
        ? [{ type: "note", text: body.remark.trim(), by: actor, at: new Date() }]
        : [],
    });

    return NextResponse.json(
      { success: true, message: "Entry created successfully", data: serializeEntry(doc) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating entry:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create entry", error: error.message },
      { status: 500 }
    );
  }
}