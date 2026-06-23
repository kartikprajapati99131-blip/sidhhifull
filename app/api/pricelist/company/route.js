// app/api/pricelist/company/route.js
import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import PriceList from "@/models/PriceList";

// ── GET /api/pricelist/company ──────────────────────────────────────────────
export async function GET() {
  try {
    await connectDb();
    const companies = await PriceList.find({}).sort({ companyName: 1 }).lean();
    return NextResponse.json({ success: true, data: companies });
  } catch (error) {
    console.error("[GET /api/pricelist/company]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch companies." },
      { status: 500 }
    );
  }
}

// ── POST /api/pricelist/company ─────────────────────────────────────────────
export async function POST(request) {
  try {
    await connectDb();
    const body = await request.json();
    const { companyName } = body;

    if (!companyName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Company name is required." },
        { status: 400 }
      );
    }

    const existing = await PriceList.findOne({
      companyName: companyName.trim(),
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A company with this name already exists." },
        { status: 409 }
      );
    }

    const company = await PriceList.create({
      companyName: companyName.trim(),
      subCategories: [],
    });

    return NextResponse.json(
      { success: true, data: company, message: "Company created successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/pricelist/company]", error);
    return NextResponse.json(
      { success: false, message: "Failed to create company." },
      { status: 500 }
    );
  }
}