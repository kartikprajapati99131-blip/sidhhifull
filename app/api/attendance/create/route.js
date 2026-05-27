import connectDb from "@/db/connectDb";
import Attendance from "@/models/Attendance";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDistance } from "@/lib/distance";

// ✅ Exact office coordinates (SIDDHI GLASS & PLYWOOD CENTER)
const OFFICE = {
  lat: 24.168452,
  lng: 72.4329712,
};

// ✅ Tightened to 50 meters — covers building, not the street outside
const ALLOWED_RADIUS = 50;

export async function POST(req) {
  await connectDb();

  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // ✅ Validate lat/lng are present in request
  if (body.lat == null || body.lng == null) {
    return Response.json(
      { error: "Location not provided" },
      { status: 400 }
    );
  }

  // ✅ Distance Check
  const distance = getDistance(
    body.lat,
    body.lng,
    OFFICE.lat,
    OFFICE.lng
  );

  if (distance > ALLOWED_RADIUS) {
    return Response.json(
      {
        error: `You are outside the office building (${Math.round(distance)}m away, allowed: ${ALLOWED_RADIUS}m)`,
      },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  // 🔍 Find today's record
  let record = await Attendance.findOne({
    userId: session.user.id,
    date: today,
  });

  // 🟢 ENTRY
  if (body.type === "entry") {
    if (record && record.entryTime) {
      return Response.json(
        { error: "Already checked in today" },
        { status: 400 }
      );
    }

    record = await Attendance.create({
      userId: session.user.id,
      date: today,
      entryTime: now,
      entryLocation: {
        lat: body.lat,
        lng: body.lng,
      },
    });

    return Response.json({ message: "Entry recorded ✅" });
  }

  // 🔴 EXIT
  if (body.type === "exit") {
    if (!record || !record.entryTime) {
      return Response.json(
        { error: "No entry found for today" },
        { status: 400 }
      );
    }

    if (record.exitTime) {
      return Response.json(
        { error: "Already checked out today" },
        { status: 400 }
      );
    }

    const diffMs = now - record.entryTime;
    const hours = diffMs / (1000 * 60 * 60);

    record.exitTime = now;
    record.exitLocation = {
      lat: body.lat,
      lng: body.lng,
    };
    record.totalHours = hours;

    await record.save();

    return Response.json({
      message: "Exit recorded ✅",
      totalHours: hours.toFixed(2),
    });
  }

  return Response.json({ error: "Invalid type" }, { status: 400 });
}