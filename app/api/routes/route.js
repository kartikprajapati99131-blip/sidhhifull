// app/api/routes/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import dbConnect from "@/db/connectDb";
import Route from "@/models/Route";
import Entry from "@/models/Entry";
import { ALLOWED_ENTRY_ROLES } from "@/app/api/entries/route";

// Route management (create/delete) is an admin-only function — same
// admin-only pattern already used for SUCCESS_RATIO_ROLES in
// app/followup/page.js. Reading the route list (GET) is available to
// every role that can already reach the entries module, since they all
// need it to populate the Route dropdown on the Add/Edit Customer form
// and the Route filter.
export const CAN_MANAGE_ROUTES_ROLES = ["admin"];

const MAX_ROUTE_NAME_LENGTH = 100;

function serializeRoute(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    createdAt: doc.createdAt,
  };
}

// GET /api/routes
// Any authenticated user with entries-module access can read the route
// list — this is read-only master data needed for dropdowns/filters, not
// a privileged action.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (!ALLOWED_ENTRY_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: your role cannot access routes" },
        { status: 403 }
      );
    }

    await dbConnect();

    // Alphabetical (A → Z), case-insensitive.
    const docs = await Route.find({}).collation({ locale: "en", strength: 2 }).sort({ name: 1 });

    return NextResponse.json({ success: true, data: docs.map(serializeRoute) }, { status: 200 });
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch routes", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/routes
// Admin only. Creates a new route master record. Duplicate names are
// rejected case-insensitively via `normalizedName`.
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (!CAN_MANAGE_ROUTES_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: only admins can manage routes" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const name = body?.name?.trim();

    if (!name) {
      return NextResponse.json({ success: false, message: "Route name is required" }, { status: 400 });
    }
    if (name.length > MAX_ROUTE_NAME_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Route name must be ${MAX_ROUTE_NAME_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    await dbConnect();

    const normalizedName = name.toLowerCase();
    const existing = await Route.findOne({ normalizedName });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `A route named "${existing.name}" already exists` },
        { status: 409 }
      );
    }

    const doc = await Route.create({
      name,
      normalizedName,
      createdBy: {
        id: session.user.id,
        name: session.user.name || "Unknown",
        role: session.user.role || "staff",
      },
    });

    return NextResponse.json(
      { success: true, message: "Route created successfully", data: serializeRoute(doc) },
      { status: 201 }
    );
  } catch (error) {
    // Belt-and-suspenders: the unique index on normalizedName can still
    // reject a race-condition duplicate that slips past the findOne check
    // above (two admins creating the same route at the same moment).
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, message: "A route with this name already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating route:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create route", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/routes?id=...
// Admin only. Refuses to delete a route that is still assigned to any
// customer entries — the caller gets back how many customers are using
// it so they can reassign them first. This guarantees a route deletion
// can never silently orphan/corrupt existing customer data.
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (!CAN_MANAGE_ROUTES_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: only admins can manage routes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid route ID" }, { status: 400 });
    }

    await dbConnect();

    const route = await Route.findById(id);
    if (!route) {
      return NextResponse.json({ success: false, message: "Route not found" }, { status: 404 });
    }

    const usageCount = await Entry.countDocuments({ route: id });
    if (usageCount > 0) {
      return NextResponse.json(
        {
          success: false,
          inUse: true,
          count: usageCount,
          message: `This route is currently assigned to ${usageCount} customer${
            usageCount === 1 ? "" : "s"
          }. Please reassign ${usageCount === 1 ? "that customer" : "those customers"} before deleting it.`,
        },
        { status: 409 }
      );
    }

    await Route.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Route deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting route:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete route", error: error.message },
      { status: 500 }
    );
  }
}
