import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/db/connectDb";
import Customer from "@/models/Customer";

/**
 * GET /api/customer
 * - admin  → all customers, newest first
 * - others → only their own customers
 */
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const isAdmin = session.user.role === "admin";
        const filter = isAdmin ? {} : { addedBy: session.user.id };

        const customers = await Customer.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        return Response.json(customers, { status: 200 });
    } catch (err) {
        console.error("GET /api/customer:", err);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/customer
 * Any authenticated user can add a customer.
 * The customer is tagged with their id, name, and role.
 */
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, address, notes } = body;

        if (!name?.trim()) {
            return Response.json({ error: "Name is required" }, { status: 400 });
        }
        if (!phone?.trim()) {
            return Response.json({ error: "Phone number is required" }, { status: 400 });
        }

        await dbConnect();

        const customer = await Customer.create({
            name:        name.trim(),
            phone:       phone.trim(),
            address:     address?.trim() || "",
            notes:       notes?.trim()   || "",
            addedBy:     session.user.id,
            addedByName: session.user.name || "",
            addedByRole: session.user.role || "user",
        });

        return Response.json({ customer }, { status: 201 });
    } catch (err) {
        console.error("POST /api/customer:", err);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}