import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/db/connectDb";
import Customer from "@/models/leads";

async function findCustomer(id) {
    const customer = await Customer.findById(id);
    if (!customer) return null;
    return customer;
}

// GET /api/customer/[id]
// Admin → any customer | Others → only their own
export async function GET(req, { params }) {
    try {
        const { id } = await params; // ✅ await params (Next.js 15)

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const customer = await findCustomer(id);
        if (!customer) {
            return Response.json({ error: "Customer not found" }, { status: 404 });
        }

        const isAdmin = session.user.role === "admin";
        const isOwner = customer.addedBy.toString() === session.user.id;

        if (!isAdmin && !isOwner) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        return Response.json(customer, { status: 200 });
    } catch (err) {
        console.error("GET /api/customer/[id]:", err);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/customer/[id]
// ADMIN ONLY
export async function PUT(req, { params }) {
    try {
        const { id } = await params; // ✅ await params (Next.js 15)

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "admin") {
            return Response.json({ error: "Forbidden — only admins can edit customers" }, { status: 403 });
        }

        await dbConnect();

        const customer = await findCustomer(id);
        if (!customer) {
            return Response.json({ error: "Customer not found" }, { status: 404 });
        }

        const body = await req.json();
        const { name, phone, address, notes } = body;

        if (name    !== undefined) customer.name    = name.trim();
        if (phone   !== undefined) customer.phone   = phone.trim();
        if (address !== undefined) customer.address = address.trim();
        if (notes   !== undefined) customer.notes   = notes.trim();

        await customer.save();

        return Response.json({ customer }, { status: 200 });
    } catch (err) {
        console.error("PUT /api/customer/[id]:", err);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/customer/[id]
// ADMIN ONLY
export async function DELETE(req, { params }) {
    try {
        const { id } = await params; // ✅ await params (Next.js 15)

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "admin") {
            return Response.json({ error: "Forbidden — only admins can delete customers" }, { status: 403 });
        }

        await dbConnect();

        const customer = await findCustomer(id);
        if (!customer) {
            return Response.json({ error: "Customer not found" }, { status: 404 });
        }

        await customer.deleteOne();

        return Response.json({ message: "Customer deleted successfully" }, { status: 200 });
    } catch (err) {
        console.error("DELETE /api/customer/[id]:", err);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}