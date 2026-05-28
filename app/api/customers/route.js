// app/api/customers/route.js
// GET  /api/customers?search=&name=&category=&bloodGroup=&religion=&city=&page=1&limit=20
// POST /api/customers  — create new customer

import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import Customer from "@/models/CustomerData";

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);

    // Pagination
    const page  = Math.max(1, parseInt(searchParams.get("page")  || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip  = (page - 1) * limit;

    // Filters
    const search     = searchParams.get("search")?.trim()     || "";
    const name       = searchParams.get("name")?.trim()       || "";
    const category   = searchParams.get("category")?.trim()   || "";
    const bloodGroup = searchParams.get("bloodGroup")?.trim() || "";
    const religion   = searchParams.get("religion")?.trim()   || "";
    const city       = searchParams.get("city")?.trim()       || "";

    const query = {};

    // Global search: matches name fields OR mobile OR city
    if (search) {
      const rx = new RegExp(search, "i");
      query.$or = [
        { firstName:  rx },
        { middleName: rx },
        { lastName:   rx },
        { mobile1:    rx },
        { mobile2:    rx },
        { city:       rx },
        { area:       rx },
      ];
    }

    // Specific field filters (AND-ed together, each narrows the result set)
    if (name) {
      const rx = new RegExp(name, "i");
      const nameFilter = { $or: [{ firstName: rx }, { middleName: rx }, { lastName: rx }] };
      // Merge with existing $or if present
      if (query.$or) {
        query.$and = [{ $or: query.$or }, nameFilter];
        delete query.$or;
      } else {
        Object.assign(query, { $or: nameFilter.$or });
      }
    }

    if (category)   query.category   = new RegExp(`^${category}$`, "i");
    if (bloodGroup) query.bloodGroup  = bloodGroup; // exact (dropdown value)
    if (religion)   query.religion    = new RegExp(religion, "i");
    if (city)       query.city        = new RegExp(city, "i");

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(query),
    ]);

    return NextResponse.json({ customers, total, page, limit });
  } catch (err) {
    console.error("GET customers error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    await connectDb();

    const body = await request.json();

    // Validate required fields
    if (!body.mobile1 || !/^\d{10}$/.test(body.mobile1)) {
      return NextResponse.json({ error: "Primary mobile must be 10 digits." }, { status: 400 });
    }
    if (!body.firstName?.trim()) {
      return NextResponse.json({ error: "First name is required." }, { status: 400 });
    }
    if (!body.lastName?.trim()) {
      return NextResponse.json({ error: "Last name is required." }, { status: 400 });
    }

    // Check for duplicate mobile1
    const existing = await Customer.findOne({ mobile1: body.mobile1 });
    if (existing) {
      return NextResponse.json(
        { error: "A customer with this primary mobile already exists." },
        { status: 409 }
      );
    }

    // Sanitise: uppercase string fields
    const strFields = [
      "firstName","middleName","lastName",
      "address1","address2","area","city","district","state",
      "religion","category",
    ];
    for (const f of strFields) {
      if (typeof body[f] === "string") body[f] = body[f].trim().toUpperCase();
    }

    const customer = await Customer.create(body);
    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (err) {
    console.error("POST customer error:", err);
    if (err.code === 11000) {
      return NextResponse.json({ error: "Duplicate mobile number." }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}