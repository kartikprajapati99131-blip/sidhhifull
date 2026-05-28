// app/api/customers/check/route.js
// GET /api/customers/check?mobile=XXXXXXXXXX
// Returns customer data if mobile1 OR mobile2 matches, else { found: false }

import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import Customer from "@/models/CustomerData";

export async function GET(request) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get("mobile")?.trim();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        { found: false, error: "Invalid mobile number" },
        { status: 400 }
      );
    }

    const customer = await Customer.findOne({
      $or: [{ mobile1: mobile }, { mobile2: mobile }],
    }).lean();

    if (!customer) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, customer });
  } catch (err) {
    console.error("Check mobile error:", err);
    return NextResponse.json({ found: false, error: "Server error" }, { status: 500 });
  }
}