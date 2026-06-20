// app/api/customers/route.js
// GET  /api/customers?search=&name=&category=&bloodGroup=&religion=&city=&addedBy=&dateFrom=&dateTo=&page=1&limit=20
// POST /api/customers  — create new customer

import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import Customer from "@/models/CustomerData";

export async function GET(request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);

    const search     = searchParams.get("search")?.trim()    || "";
    const name       = searchParams.get("name")?.trim()      || "";
    const category   = searchParams.get("category")?.trim()  || "";
    const bloodGroup = searchParams.get("bloodGroup")?.trim()|| "";
    const religion   = searchParams.get("religion")?.trim()  || "";
    const city       = searchParams.get("city")?.trim()      || "";
    const addedBy    = searchParams.get("addedBy")?.trim()   || "";
    const dateFrom   = searchParams.get("dateFrom")?.trim()  || "";
    const dateTo     = searchParams.get("dateTo")?.trim()    || "";
    const page       = Math.max(1, parseInt(searchParams.get("page")  || "1", 10));
    const limit      = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));

    const query = {};

    // General search across mobile, name, city
    if (search) {
      query.$or = [
        { mobile1:    new RegExp(search, "i") },
        { mobile2:    new RegExp(search, "i") },
        { firstName:  new RegExp(search, "i") },
        { middleName: new RegExp(search, "i") },
        { lastName:   new RegExp(search, "i") },
        { city:       new RegExp(search, "i") },
      ];
    }

    if (name) {
      const nameOr = [
        { firstName:  new RegExp(name, "i") },
        { middleName: new RegExp(name, "i") },
        { lastName:   new RegExp(name, "i") },
      ];
      query.$and = query.$and
        ? [...query.$and, { $or: nameOr }]
        : [{ $or: nameOr }];
    }

    if (category)   query.category   = new RegExp(category, "i");
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (religion)   query.religion   = new RegExp(religion, "i");
    if (city)       query.city       = new RegExp(city, "i");
    if (addedBy)    query.createdBy  = new RegExp(addedBy, "i");

    // createdAt date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Customer.countDocuments(query),
    ]);

    return NextResponse.json({ customers, total, page, limit });
  } catch (err) {
    console.error("GET customers error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDb();
    const body = await request.json();

    // Sanitise birthDate
    if (body.birthDate === "" || body.birthDate === undefined) {
      body.birthDate = null;
    }

    const customer = await Customer.create(body);
    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Mobile number already registered." }, { status: 409 });
    }
    console.error("POST customers error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}