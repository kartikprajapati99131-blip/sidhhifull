// app/api/review/get/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/db/connectDb";
import Review from "@/models/Review";

export async function GET(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");
    const reviews = await Review.find({ staffId }).sort({ createdAt: -1 });
    return NextResponse.json(reviews);
}