import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust to your actual path
import dbConnect from "@/lib/dbConnect";
import Policy from "@/models/Policy";
import PolicyCategory from "@/models/PolicyCategory";

// GET /api/policies?category=staff&status=active&search=leave
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query = {};

    if (categorySlug && categorySlug !== "all") {
      const category = await PolicyCategory.findOne({ slug: categorySlug });
      if (!category) {
        return NextResponse.json({ success: true, data: [] });
      }
      query.category = category._id;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    const policies = await Policy.find(query)
      .populate("category", "name slug color icon")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: policies });
  } catch (error) {
    console.error("GET /api/policies error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch policies" }, { status: 500 });
  }
}

// POST /api/policies -> create a new policy under a category
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["admin", "subadmin"].includes(session.user?.role)) {
      return NextResponse.json(
        { success: false, message: "Not authorized to create policies" },
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await request.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ success: false, message: "Policy title is required" }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ success: false, message: "Category is required" }, { status: 400 });
    }
    if (!Array.isArray(body.rules) || body.rules.filter((r) => r?.text?.trim()).length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one rule is required" },
        { status: 400 }
      );
    }

    const rules = body.rules
      .filter((r) => r && r.text && r.text.trim())
      .map((r, idx) => ({ text: r.text.trim(), order: idx }));

    const policy = await Policy.create({
      title: body.title.trim(),
      category: body.category,
      description: body.description || "",
      rules,
      status: body.status || "active",
      version: body.version || "1.0",
      effectiveDate: body.effectiveDate || Date.now(),
      tags: body.tags || [],
      createdBy: session.user?.name || session.user?.email || "system",
      updatedBy: session.user?.name || session.user?.email || "system",
      history: [{
        action: "created",
        changedBy: session.user?.name || session.user?.email || "system",
        note: "Policy created",
      }],
    });

    await policy.populate("category", "name slug color icon");

    return NextResponse.json({ success: true, data: policy }, { status: 201 });
  } catch (error) {
    console.error("POST /api/policies error:", error);
    return NextResponse.json({ success: false, message: "Failed to create policy" }, { status: 500 });
  }
}