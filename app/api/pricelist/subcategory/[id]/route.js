// app/api/pricelist/subcategory/[id]/route.js
// [id] = subcategory _id (MongoDB sub-document id)
import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import PriceList from "@/models/PriceList";

// ── PUT /api/pricelist/subcategory/[id] ─────────────────────────────────────
// Body: { companyId, name }
export async function PUT(request, { params }) {
  try {
    await connectDb();
    const { id } = params; // subcategory _id
    const { companyId, name } = await request.json();

    if (!companyId || !name?.trim()) {
      return NextResponse.json(
        { success: false, message: "companyId and name are required." },
        { status: 400 }
      );
    }

    const company = await PriceList.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found." },
        { status: 404 }
      );
    }

    const subCat = company.subCategories.id(id);
    if (!subCat) {
      return NextResponse.json(
        { success: false, message: "Sub-category not found." },
        { status: 404 }
      );
    }

    subCat.name = name.trim();
    await company.save();

    return NextResponse.json({
      success: true,
      data: subCat,
      message: "Sub-category updated successfully.",
    });
  } catch (error) {
    console.error("[PUT /api/pricelist/subcategory/[id]]", error);
    return NextResponse.json(
      { success: false, message: "Failed to update sub-category." },
      { status: 500 }
    );
  }
}

// ── DELETE /api/pricelist/subcategory/[id] ──────────────────────────────────
// Query param: ?companyId=xxx
export async function DELETE(request, { params }) {
  try {
    await connectDb();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "companyId query param is required." },
        { status: 400 }
      );
    }

    const company = await PriceList.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found." },
        { status: 404 }
      );
    }

    const subCat = company.subCategories.id(id);
    if (!subCat) {
      return NextResponse.json(
        { success: false, message: "Sub-category not found." },
        { status: 404 }
      );
    }

    subCat.deleteOne();
    await company.save();

    return NextResponse.json({
      success: true,
      message: "Sub-category and all its products deleted.",
    });
  } catch (error) {
    console.error("[DELETE /api/pricelist/subcategory/[id]]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete sub-category." },
      { status: 500 }
    );
  }
}