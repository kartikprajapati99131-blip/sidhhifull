// app/api/review/create/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/db/connectDb";
import Review from "@/models/Review";

export async function POST(req) {
    await dbConnect();
    const { staffId, rating, comment, reviewerName, reviewerPhone } = await req.json();

    if (!staffId || !rating || !reviewerName || !reviewerPhone) {
        return NextResponse.json(
            { error: "staffId, rating, name and phone are required" },
            { status: 400 }
        );
    }

    const review = await Review.create({ staffId, rating, comment, reviewerName, reviewerPhone });
    return NextResponse.json({ success: true, review });
}