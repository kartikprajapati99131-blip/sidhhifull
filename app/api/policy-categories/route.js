// app/api/policy-categories/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import dbConnect from "@/lib/dbConnect";
import PolicyCategory from "@/models/PolicyCategory";
import Policy from "@/models/Policy";

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/policy-categories -> all categories, each with a live policy count
export async function GET() {
  try {
    await dbConnect();

    const categories = await PolicyCategory.find().sort({ order: 1, name: 1 }).lean();

    const counts = await Policy.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const data = categories.map((cat) => ({
      ...cat,
      policyCount: countMap[cat._id.toString()] || 0,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/policy-categories error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/policy-categories -> create a new category on the fly
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["admin", "subadmin"].includes(session.user?.role)) {
      return NextResponse.json(
        { success: false, message: "Not authorized to create categories" },
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    const slug = slugify(body.name);

    const existing = await PolicyCategory.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A category with this name already exists" },
        { status: 409 }
      );
    }

    const lastCategory = await PolicyCategory.findOne().sort({ order: -1 });
    const order = lastCategory ? lastCategory.order + 1 : 0;

    const category = await PolicyCategory.create({
      name: body.name.trim(),
      slug,
      description: body.description || "",
      icon: body.icon || "FileText",
      color: body.color || "#6366f1",
      order,
      createdBy: session.user?.name || session.user?.email || "system",
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/policy-categories error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 }
    );
  }
}