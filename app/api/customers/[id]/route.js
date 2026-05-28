// app/api/customers/[id]/route.js
// GET    /api/customers/:id
// PUT    /api/customers/:id
// DELETE /api/customers/:id  (admin only — enforce on client side by role)

import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import Customer from "@/models/CustomerData";

export async function GET(request, { params }) {
  try {
    await connectDb();
    const customer = await Customer.findById(params.id).lean();
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ customer });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDb();
    const body = await request.json();

    const updated = await Customer.findByIdAndUpdate(
      params.id,
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
    await connectDb();
    const deleted = await Customer.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}