import dbConnect from "@/db/connectDb";
import ReferenceName from "@/models/ReferenceName";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ⚠️ adjust to your actual authOptions export path

// GET /api/due-payments/references
// Returns the full list of reference names, alphabetically sorted.
// Available to any signed-in role (collection + admin) so the dropdown can render.
export async function GET() {
  try {
    await dbConnect();
    const refs = await ReferenceName.find({}).sort({ name: 1 }).lean();
    return NextResponse.json(
      { success: true, references: refs.map((r) => r.name) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching reference names:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch reference names", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/due-payments/references
// Adds a new reference name. ADMIN ONLY.
// Body: { name: string }
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Only admins can add new reference names" },
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const name = (body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    const existing = await ReferenceName.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
    if (existing) {
      const refs = await ReferenceName.find({}).sort({ name: 1 }).lean();
      return NextResponse.json(
        { success: true, references: refs.map((r) => r.name), message: "Already exists" },
        { status: 200 }
      );
    }

    await ReferenceName.create({ name });
    const refs = await ReferenceName.find({}).sort({ name: 1 }).lean();

    return NextResponse.json(
      { success: true, references: refs.map((r) => r.name) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding reference name:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add reference name", error: error.message },
      { status: 500 }
    );
  }
}
