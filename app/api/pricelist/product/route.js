// app/api/pricelist/product/route.js
import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import PriceList from "@/models/PriceList";

// ── POST /api/pricelist/product ─────────────────────────────────────────────
// Body: { companyId, subCategoryId, productName, code, thickness, rate, netPrice, dp }
export async function POST(request) {
  try {
    await connectDb();
    const body = await request.json();
    const {
      companyId,
      subCategoryId,
      productName,
      code,
      thickness = "",
      rate = 0,
      netPrice = 0,
      dp = 0,
    } = body;

    if (!companyId || !subCategoryId || !productName?.trim() || !code?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "companyId, subCategoryId, productName and code are required.",
        },
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

    const subCat = company.subCategories.id(subCategoryId);
    if (!subCat) {
      return NextResponse.json(
        { success: false, message: "Sub-category not found." },
        { status: 404 }
      );
    }

    const newProduct = {
      productName: productName.trim(),
      code: code.trim(),
      thickness: thickness.trim(),
      rate: Number(rate),
      netPrice: Number(netPrice),
      dp: Number(dp),
      createdAt: new Date(),
    };

    subCat.products.push(newProduct);
    await company.save();

    const saved = subCat.products[subCat.products.length - 1];

    return NextResponse.json(
      { success: true, data: saved, message: "Product added successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/pricelist/product]", error);
    return NextResponse.json(
      { success: false, message: "Failed to add product." },
      { status: 500 }
    );
  }
}