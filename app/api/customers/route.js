    // app/api/customers/route.js

    import { NextResponse } from "next/server";
    import connectDb from "@/db/connectDb";
    import Customer from "@/models/CustomerData";

    export async function GET(request) {
        try {
            await connectDb();

            const { searchParams } = new URL(request.url);
            const search = searchParams.get("search")?.trim() || "";
            const bloodGroup = searchParams.get("bloodGroup")?.trim() || "";
            const religion = searchParams.get("religion")?.trim() || "";
            const city = searchParams.get("city")?.trim() || "";
            const name = searchParams.get("name")?.trim() || "";
            const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
            const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));

            const query = {};

            if (bloodGroup) query.bloodGroup = bloodGroup;
            if (religion) query.religion = new RegExp(religion, "i");
            if (city) query.city = new RegExp(city, "i");

            if (name) {
                query.$or = [
                    { firstName: new RegExp(name, "i") },
                    { middleName: new RegExp(name, "i") },
                    { lastName: new RegExp(name, "i") },
                ];
            }

            if (search) {
                const searchOr = [
                    { firstName: new RegExp(search, "i") },
                    { middleName: new RegExp(search, "i") },
                    { lastName: new RegExp(search, "i") },
                    { mobile1: new RegExp(search, "i") },
                    { mobile2: new RegExp(search, "i") },
                    { city: new RegExp(search, "i") },
                    { area: new RegExp(search, "i") },
                    { religion: new RegExp(search, "i") },
                ];
                if (query.$or) {
                    query.$and = [{ $or: query.$or }, { $or: searchOr }];
                    delete query.$or;
                } else {
                    query.$or = searchOr;
                }
            }

            const total = await Customer.countDocuments(query);
            const customers = await Customer.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            return NextResponse.json({ customers, total, page, limit });
        } catch (err) {
            console.error("GET customers error:", err.message, err.stack);
            return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
        }
    }

    export async function POST(request) {
        try {
            await connectDb();

            let body;
            try {
                body = await request.json();
            } catch {
                return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
            }

            const {
                mobile1, mobile2 = "", category = "",
                firstName, middleName = "", lastName,
                address1 = "", address2 = "", area = "",
                city = "", district = "", state = "", pincode = "",
                bloodGroup = "", religion = "", createdBy = "",
            } = body;

            // ── Validate required fields ─────────────────────────────────    ─────────────
            if (!mobile1 || !/^\d{10}$/.test(String(mobile1))) {
                return NextResponse.json(
                    { error: "Valid 10-digit primary mobile is required" },
                    { status: 400 }
                );
            }
            if (!firstName?.trim()) {
                return NextResponse.json({ error: "First name is required" }, { status: 400 });
            }
            if (!lastName?.trim()) {
                return NextResponse.json({ error: "Last name is required" }, { status: 400 });
            }

            const mob1 = String(mobile1).trim();
            const mob2 = String(mobile2 || "").trim();

            // ── Uniqueness check (only on non-empty numbers) ──────────────────────────
            const orConditions = [{ mobile1: mob1 }];
            if (mob2) {
                orConditions.push({ mobile1: mob2 });   // mob2 of new = mob1 of existing?
                orConditions.push({ mobile2: mob1 });   // mob1 of new = mob2 of existing?
                orConditions.push({ mobile2: mob2 });   // mob2 matches existing mob2?
            } else {
                orConditions.push({ mobile2: mob1 });   // mob1 of new = mob2 of existing?
            }

            const existing = await Customer.findOne({ $or: orConditions }).lean();
            if (existing) {
                return NextResponse.json(
                    { error: "A customer with this mobile number already exists", existing },
                    { status: 409 }
                );
            }

            // ── Create ────────────────────────────────────────────────────────────────
            const customer = await Customer.create({
                mobile1: mob1,
                mobile2: mob2,
                category: category.trim(),
                firstName: firstName.trim(),
                middleName: middleName.trim(),
                lastName: lastName.trim(),
                address1: address1.trim(),
                address2: address2.trim(),
                area: area.trim(),
                city: city.trim(),
                district: district.trim(),
                state: state.trim(),
                pincode: pincode.trim(),
                bloodGroup: bloodGroup.trim(),
                religion: religion.trim(),
                createdBy: createdBy.trim(),
            });

            return NextResponse.json({ success: true, customer }, { status: 201 });

        } catch (err) {
            console.error("POST customers error:", err.message, err.stack);

            // Mongoose duplicate key
            if (err.code === 11000) {
                const field = Object.keys(err.keyValue || {})[0] || "mobile";
                return NextResponse.json(
                    { error: `This ${field} is already registered` },
                    { status: 409 }
                );
            }
            // Mongoose validation error
            if (err.name === "ValidationError") {
                const messages = Object.values(err.errors).map((e) => e.message).join(", ");
                return NextResponse.json({ error: messages }, { status: 400 });
            }

            return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
        }
    }