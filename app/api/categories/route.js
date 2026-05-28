// app/api/categories/route.js
// GET  /api/categories        → returns all category names sorted
// POST /api/categories        → adds a new category (admin only — enforce on client)

import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectDb();
    const cats = await Category.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ categories: cats.map((c) => c.name) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDb();
    const { name } = await request.json();

    const trimmed = (name || "").trim().toUpperCase();
    if (!trimmed) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }

    // upsert — silently ignore duplicate
    await Category.findOneAndUpdate(
      { name: trimmed },
      { name: trimmed },
      { upsert: true, new: true }
    );

    const cats = await Category.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, categories: cats.map((c) => c.name) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}   