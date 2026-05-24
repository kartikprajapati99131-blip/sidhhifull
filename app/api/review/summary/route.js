// app/api/review/summary/route.js  — returns all staff with avg rating
import { NextResponse } from "next/server";
import dbConnect from "@/db/connectDb";
import Review from "@/models/Review";
import User from "@/models/user";

export async function GET() {
    await dbConnect();

    const staff = await User.find({ role: { $in: ["staff", "mistry", "architect"] } });

    const summary = await Promise.all(
        staff.map(async (s) => {
            const reviews = await Review.find({ staffId: s._id });
            const totalReviews = reviews.length;
            const avgRating = totalReviews
                ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
                : 0;
            return {
                _id: s._id,
                name: s.name,
                role: s.role,
                avgRating,
                totalReviews,
            };
        })
    );

    return NextResponse.json(summary);
}