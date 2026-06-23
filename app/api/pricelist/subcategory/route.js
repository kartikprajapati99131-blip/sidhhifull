// app/api/pricelist/subcategory/route.js
import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import PriceList from "@/models/PriceList";

// ── POST /api/pricelist/subcategory ─────────────────────────────────────────
// Body: { companyId, name }
export async function POST(request) {
  try {
    await connectDb();
    const { companyId, name } = await request.json();

    if (!companyId || !name?.trim()) {
      return NextResponse.json(
        { success: false, message: "companyId and subcategory name are required." },
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

    // Prevent duplicate sub-category names within the same company
    const duplicate = company.subCategories.find(
      (sc) => sc.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "Sub-category with this name already exists." },
        { status: 409 }
      );
    }

    company.subCategories.push({ name: name.trim(), products: [] });
    await company.save();

    const newSubCat =
      company.subCategories[company.subCategories.length - 1];

    return NextResponse.json(
      {
        success: true,
        data: newSubCat,
        message: "Sub-category created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/pricelist/subcategory]", error);
    return NextResponse.json(
      { success: false, message: "Failed to create sub-category." },
      { status: 500 }
    );
  }
}