// app/api/pricelist/company/[id]/route.js
import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import PriceList from "@/models/PriceList";

// ── PUT /api/pricelist/company/[id] ─────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    await connectDb();
    const { id } = params;
    const { companyName } = await request.json();

    if (!companyName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Company name is required." },
        { status: 400 }
      );
    }

    // Check for name collision (exclude current doc)
    const collision = await PriceList.findOne({
      companyName: companyName.trim(),
      _id: { $ne: id },
    });
    if (collision) {
      return NextResponse.json(
        { success: false, message: "Another company with this name exists." },
        { status: 409 }
      );
    }

    const updated = await PriceList.findByIdAndUpdate(
      id,
      { companyName: companyName.trim() },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Company not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Company updated successfully.",
    });
  } catch (error) {
    console.error("[PUT /api/pricelist/company/[id]]", error);
    return NextResponse.json(
      { success: false, message: "Failed to update company." },
      { status: 500 }
    );
  }
}

// ── DELETE /api/pricelist/company/[id] ──────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    await connectDb();
    const { id } = params;

    const deleted = await PriceList.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Company not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Company and all its data deleted successfully.",
    });
  } catch (error) {
    console.error("[DELETE /api/pricelist/company/[id]]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete company." },
      { status: 500 }
    );
  }
}