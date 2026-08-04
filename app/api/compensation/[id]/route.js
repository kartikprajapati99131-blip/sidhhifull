import connectDb from "@/db/connectDb";
import Compensation from "@/models/Compensation";
import { getSessionUser, canManageCompensation } from "@/lib/compensationAuth";

// ─────────────────────────────────────────────
// GET — single compensation record.
//   Managers can view any record; employees only their own.
// ─────────────────────────────────────────────
export async function GET(req, { params }) {
  await connectDb();

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const record = await Compensation.findById(id).lean();
  if (!record) {
    return Response.json({ error: "Compensation record not found" }, { status: 404 });
  }

  const isManager = canManageCompensation(user);
  if (!isManager && record.employeeId !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ record }, { headers: { "Cache-Control": "no-store" } });
}

// ─────────────────────────────────────────────
// PUT — edit a compensation record (Admin / Sub Admin only)
// ─────────────────────────────────────────────
export async function PUT(req, { params }) {
  await connectDb();

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageCompensation(user)) {
    return Response.json(
      { error: "Only Admin or Sub Admin can edit compensation" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const { employeeId, employeeName, hours, minutes, reason, description, date } = body;

  if (!employeeId || !employeeName) {
    return Response.json({ error: "Employee is required" }, { status: 400 });
  }

  const hoursNum = Number(hours);
  if (hours === undefined || hours === null || hours === "" || isNaN(hoursNum) || hoursNum < 0) {
    return Response.json({ error: "Hours is required and must be 0 or more" }, { status: 400 });
  }

  const minutesNum = Number(minutes ?? 0);
  if (isNaN(minutesNum) || minutesNum < 0 || minutesNum > 59) {
    return Response.json({ error: "Minutes must be between 0 and 59" }, { status: 400 });
  }

  if (!reason) {
    return Response.json({ error: "Reason is required" }, { status: 400 });
  }

  if (!date) {
    return Response.json({ error: "Date is required" }, { status: 400 });
  }

  const record = await Compensation.findById(id);
  if (!record) {
    return Response.json({ error: "Compensation record not found" }, { status: 404 });
  }

  record.employeeId = employeeId;
  record.employeeName = employeeName;
  record.hours = hoursNum;
  record.minutes = minutesNum;
  record.reason = reason;
  // Same required field as create — keep it in sync with reason on edit.
  record.description = description || reason;
  record.date = date;

  await record.save();

  return Response.json(
    { message: "Compensation Updated Successfully", record },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// ─────────────────────────────────────────────
// DELETE — remove a compensation record (Admin / Sub Admin only)
// ─────────────────────────────────────────────
export async function DELETE(req, { params }) {
  await connectDb();

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageCompensation(user)) {
    return Response.json(
      { error: "Only Admin or Sub Admin can delete compensation" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const record = await Compensation.findByIdAndDelete(id);
  if (!record) {
    return Response.json({ error: "Compensation record not found" }, { status: 404 });
  }

  return Response.json(
    { message: "Compensation Deleted Successfully" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
