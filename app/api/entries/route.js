// app/api/entries/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
// ⚠️ Adjust this import to wherever you export `authOptions` from in your
// NextAuth setup, e.g. "@/lib/authOptions" or "@/app/api/auth/[...nextauth]/route".
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import dbConnect from "@/db/connectDb";
import Entry from "@/models/Entry";
import { serializeEntry } from "@/lib/serializeEntry";

// Roles allowed to see every CUSTOMER entry, not just their own — keep
// this in sync with app/entries/followup/page.js and the [id] routes.
export const CAN_SEE_ALL_ROLES = ["admin", "sales", "subadmin"];

// Roles allowed to see every MISTRY entry (added by anyone). Sales is
// deliberately excluded: sales sees all customers, but only the Mistry
// entries they personally created.
export const CAN_SEE_ALL_MISTRY_ROLES = ["admin", "subadmin"];

// Roles allowed to delete entries — separate from CAN_SEE_ALL_ROLES on
// purpose. Sales can view/add/edit but must NEVER be able to delete,
// even via a direct API call.
export const CAN_DELETE_ROLES = ["admin", "subadmin"];

// GET /api/entries
// admin & subadmin -> every entry, of both types.
// sales             -> every customer entry, but ONLY the mistry entries
//                       they created themselves.
// everyone else     -> only entries they created (either type).
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const role = session.user.role;
    const seesAllMistry = CAN_SEE_ALL_MISTRY_ROLES.includes(role);
    const seesAllCustomers = CAN_SEE_ALL_ROLES.includes(role);

    let filter;
    if (seesAllMistry) {
      // admin / subadmin: no restrictions at all.
      filter = {};
    } else if (seesAllCustomers) {
      // sales: all customers, but mistry entries only if they created them.
      filter = {
        $or: [
          { type: "customer" },
          { type: "mistry", "createdBy.id": session.user.id },
        ],
      };
    } else {
      // any other role: only their own entries, regardless of type.
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