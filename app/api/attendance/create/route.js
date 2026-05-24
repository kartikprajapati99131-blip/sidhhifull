import connectDb from "@/db/connectDb";
import Attendance from "@/models/Attendance";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDistance } from "@/lib/distance";

const OFFICE = {
  lat: 24.1654,
  lng: 72.4328
  ,
};

const ALLOWED_RADIUS = 100;

export async function POST(req) {
  await connectDb();


  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // ✅ 1. Distance Check
  const distance = getDistance(
    body.lat,
    body.lng,
    OFFICE.lat,
    OFFICE.lng
  );

  if (distance > ALLOWED_RADIUS) {
    return Response.json(
      { error: "You are outside allowed area" },
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
        { error: "Already checked in" },
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
        { error: "No entry found" },
        { status: 400 }
      );
    }

    if (record.exitTime) {
      return Response.json(
        { error: "Already checked out" },
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

  return Response.json(
    { error: "Invalid type" },
    { status: 400 }
  );
}