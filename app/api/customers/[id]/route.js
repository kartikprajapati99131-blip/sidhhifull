// app/api/customers/[id]/route.js
// GET    /api/customers/:id
// PUT    /api/customers/:id
// DELETE /api/customers/:id

import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import Customer from "@/models/CustomerData";

// ── Next.js 15: params is a Promise — must be awaited ────────────────────────

export async function GET(request, { params }) {
  try {
    const { id } = await params;          // ← await here
    await connectDb();
    const customer = await Customer.findById(id).lean();
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ customer });
  } catch (err) {
    console.error("GET customer error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;          // ← await here
    await connectDb();
    const body = await request.json();

    // Strip internal fields the client should never overwrite directly
    delete body._id;
    delete body.__v;
    delete body.createdAt;
    delete body.createdBy;

    const updated = await Customer.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, customer: updated });
  } catch (err) {
    console.error("PUT customer error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;          // ← await here
    await connectDb();
    const deleted = await Customer.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE customer error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}