// app/api/user/[id]/route.js
import connectDb from "@/db/connectDb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";

// ✅ GET single user by id
export async function GET(req, { params }) {
    try {
        const { id } = await params;

        await connectDb();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const user = await User.findById(id).select("-password").lean();

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);

    } catch (err) {
        console.error("GET ERROR:", err);
        if (err.message === "UNAUTHORIZED") return NextResponse.json({}, { status: 401 });
        if (err.message === "FORBIDDEN") return NextResponse.json({}, { status: 403 });
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ✅ PUT — your existing code, unchanged
export async function PUT(req, { params }) {
    console.log(params);
    try {
        const { id } = await params;

        await requireAdmin();
        await connectDb();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const body = await req.json();

        // handle points update
        if (body.points !== undefined) {
            const updatedUser = await User.findByIdAndUpdate(
                id,
                {
                    $inc: { points: body.points },
                    $push: {
                        pointsLog: {
                            amount: body.points,
                            reason: body.reason || "Points added by admin",
                            createdAt: new Date(),
                        }
                    }
                },
                { new: true }
            ).select("-password");

            if (!updatedUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
            return NextResponse.json({ success: true, user: updatedUser });
        }

        // handle role update
        const allowedRoles = ["admin", "user", "staff", "mistry", "architect"];
        if (!allowedRoles.includes(body.role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { role: body.role },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(updatedUser);

    } catch (err) {
        console.error("PUT ERROR:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}