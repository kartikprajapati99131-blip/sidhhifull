import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust to your actual path
import dbConnect from "@/lib/dbConnect";
import Policy from "@/models/Policy";

// NOTE: in Next.js 15+, `params` is a Promise and must be awaited before use.
// Awaiting it is also safe on Next.js 14, where it's already a plain object.

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const policy = await Policy.findById(id).populate("category", "name slug color icon");
    if (!policy) {
      return NextResponse.json({ success: false, message: "Policy not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: policy });
  } catch (error) {
    console.error("GET /api/policies/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch policy" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["admin", "subadmin"].includes(session.user?.role)) {
      return NextResponse.json(
        { success: false, message: "Not authorized to update policies" },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const policy = await Policy.findById(id);
    if (!policy) {
      return NextResponse.json({ success: false, message: "Policy not found" }, { status: 404 });
    }

    if (body.title) policy.title = body.title.trim();
    if (body.category) policy.category = body.category;
    if (body.description !== undefined) policy.description = body.description;
    if (Array.isArray(body.rules)) {
      policy.rules = body.rules
        .filter((r) => r && r.text && r.text.trim())
        .map((r, idx) => ({ text: r.text.trim(), order: idx }));
    }
    if (body.status) policy.status = body.status;
    if (body.version) policy.version = body.version;
    if (body.effectiveDate) policy.effectiveDate = body.effectiveDate;
    if (body.tags) policy.tags = body.tags;

    const actor = session.user?.name || session.user?.email || "system";
    policy.updatedBy = actor;
    policy.history.push({
      action: body.status === "archived" ? "archived" : "updated",
      changedBy: actor,
      note: body.changeNote || "Policy updated",
    });

    await policy.save();
    await policy.populate("category", "name slug color icon");

    return NextResponse.json({ success: true, data: policy });
  } catch (error) {
    console.error("PUT /api/policies/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to update policy" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["admin", "subadmin"].includes(session.user?.role)) {
      return NextResponse.json(
        { success: false, message: "Not authorized to delete policies" },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = await params;

    const policy = await Policy.findByIdAndDelete(id);
    if (!policy) {
      return NextResponse.json({ success: false, message: "Policy not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Policy deleted" });
  } catch (error) {
    console.error("DELETE /api/policies/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete policy" }, { status: 500 });
  }
}