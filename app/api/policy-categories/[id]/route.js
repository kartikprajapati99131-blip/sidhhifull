// app/api/policy-categories/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust to your actual path
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

// NOTE: in Next.js 15+, `params` is a Promise and must be awaited before use.
// Awaiting it is also safe on Next.js 14, where it's already a plain object.

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["admin", "subadmin"].includes(session.user?.role)) {
      return NextResponse.json(
        { success: false, message: "Not authorized to update categories" },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updateData = {};
    if (body.description !== undefined) updateData.description = body.description;
    if (body.icon) updateData.icon = body.icon;
    if (body.color) updateData.color = body.color;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.name) {
      updateData.name = body.name.trim();
      updateData.slug = slugify(body.name);
    }

    const category = await PolicyCategory.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("PUT /api/policy-categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["admin", "subadmin"].includes(session.user?.role)) {
      return NextResponse.json(
        { success: false, message: "Not authorized to delete categories" },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = await params;

    const policyCount = await Policy.countDocuments({ category: id });
    if (policyCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete: ${policyCount} polic${
            policyCount === 1 ? "y is" : "ies are"
          } still assigned to this category. Move or delete them first.`,
        },
        { status: 409 }
      );
    }

    const category = await PolicyCategory.findByIdAndDelete(id);
    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("DELETE /api/policy-categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete category" },
      { status: 500 }
    );
  }
}