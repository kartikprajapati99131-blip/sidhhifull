import connectDb from "@/db/connectDb";
import Attendance from "@/models/Attendance";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req) {
  await connectDb();
  await requireAdmin();

  const body = await req.json();
  const { attendanceId, exitTime, remark } = body;

  if (!attendanceId || !exitTime) {
    return Response.json(
      { error: "attendanceId and exitTime are required" },
      { status: 400 }
    );
  }

  const record = await Attendance.findById(attendanceId);
  if (!record) {
    return Response.json({ error: "Attendance record not found" }, { status: 404 });
  }

  if (!record.entryTime) {
    return Response.json(
      { error: "Cannot add an exit — this record has no entry time" },
      { status: 400 }
    );
  }

  const exitDate = new Date(exitTime);
  if (isNaN(exitDate)) {
    return Response.json({ error: "Invalid exit time" }, { status: 400 });
  }

  if (exitDate <= new Date(record.entryTime)) {
    return Response.json(
      { error: "Exit time must be after entry time" },
      { status: 400 }
    );
  }

  const diffMs = exitDate - new Date(record.entryTime);
  const hours = diffMs / (1000 * 60 * 60);

  record.exitTime = exitDate;
  record.totalHours = hours;
  record.remark = remark || "";
  record.exitAddedByAdmin = true;

  await record.save();

  return Response.json(
    {
      message: "Exit added by admin ✅",
      totalHours: hours.toFixed(2),
      record,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}