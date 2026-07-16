// app/api/entries/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
// ⚠️ Adjust this import to wherever you export `authOptions` from in your
// NextAuth setup, e.g. "@/lib/authOptions" or "@/app/api/auth/[...nextauth]/route".
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import connectDb from "@/db/connectDb";
import Entry from "@/models/Entry";
import { serializeEntry } from "@/lib/serializeEntry";

// Roles allowed to see every entry, not just their own — keep this in sync
// with the same constant in app/members/page.jsx.
const CAN_SEE_ALL_ROLES = ["admin", "sales"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDb();

  const canSeeAll = CAN_SEE_ALL_ROLES.includes(session.user.role);
  const filter = canSeeAll ? {} : { "createdBy.id": session.user.id };

  const docs = await Entry.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(docs.map(serializeEntry));
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !["customer", "mistry"].includes(body.type)) {
    return NextResponse.json({ error: "Invalid entry type" }, { status: 400 });
  }
  if (!body.mobile1?.trim() || !body.name?.trim()) {
    return NextResponse.json(
      { error: "Mobile No 1 and name are required" },
      { status: 400 }
    );
  }

  await connectDb();

  const actor = {
    id: session.user.id,
    name: session.user.name || "Unknown",
    role: session.user.role || "staff",
  };

  const doc = await Entry.create({
    type: body.type,
    mobile1: body.mobile1,
    mobile2: body.mobile2,
    name: body.name,
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

  return NextResponse.json(serializeEntry(doc), { status: 201 });
}