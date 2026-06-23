// app/api/pricelist/product/[id]/route.js
// [id] = product _id (MongoDB sub-document id)
import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import PriceList from "@/models/PriceList";

// ── PUT /api/pricelist/product/[id] ─────────────────────────────────────────
// Body: { companyId, subCategoryId, productName, code, thickness, rate, netPrice, dp }
export async function PUT(request, { params }) {
  try {
    await connectDb();
    const { id } = params;
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

    if (!companyId || !subCategoryId) {
      return NextResponse.json(
        { success: false, message: "companyId and subCategoryId are required." },
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

    const product = subCat.products.id(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    // Update only supplied fields
    if (productName?.trim()) product.productName = productName.trim();
    if (code?.trim())        product.code        = code.trim();
    product.thickness = thickness?.trim() ?? product.thickness;
    product.rate      = Number(rate);
    product.netPrice  = Number(netPrice);
    product.dp        = Number(dp);

    await company.save();

    return NextResponse.json({
      success: true,
      data: product,
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("[PUT /api/pricelist/product/[id]]", error);
    return NextResponse.json(
      { success: false, message: "Failed to update product." },
      { status: 500 }
    );
  }
}

// ── DELETE /api/pricelist/product/[id] ──────────────────────────────────────
// Query params: ?companyId=xxx&subCategoryId=yyy
export async function DELETE(request, { params }) {
  try {
    await connectDb();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const companyId     = searchParams.get("companyId");
    const subCategoryId = searchParams.get("subCategoryId");

    if (!companyId || !subCategoryId) {
      return NextResponse.json(
        { success: false, message: "companyId and subCategoryId are required." },
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

    const product = subCat.products.id(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    product.deleteOne();
    await company.save();

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("[DELETE /api/pricelist/product/[id]]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product." },
      { status: 500 }
    );
  }
}