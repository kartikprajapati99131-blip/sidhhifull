// app/api/review/delete/route.js

import { NextResponse } from "next/server";
import dbConnect from "@/db/connectDb";
import Review from "@/models/Review";

export async function DELETE(req) {
    try {
        await dbConnect();

        const { reviewId } = await req.json();

        if (!reviewId) {
            return NextResponse.json({ error: "reviewId is required." }, { status: 400 });
        }

        const deleted = await Review.findByIdAndDelete(reviewId);

        if (!deleted) {
            return NextResponse.json({ error: "Review not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Review deleted successfully." });

    } catch (err) {
        console.error("Delete review error:", err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}