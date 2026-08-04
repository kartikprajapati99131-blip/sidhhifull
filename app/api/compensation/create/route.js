import connectDb from "@/db/connectDb";
import Compensation from "@/models/Compensation";
import { getSessionUser, canManageCompensation } from "@/lib/compensationAuth";

// ─────────────────────────────────────────────
// POST — create a Compensation record (Admin / Sub Admin only)
// ─────────────────────────────────────────────
export async function POST(req) {
  await connectDb();

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageCompensation(user)) {
    return Response.json(
      { error: "Only Admin or Sub Admin can add compensation" },
      { status: 403 }
    );
  }

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

  const record = await Compensation.create({
    employeeId,
    employeeName,
    hours: hoursNum,
    minutes: minutesNum,
    reason,
    // Your live Compensation schema also requires `description` (not
    // present in the model file originally shared) — default it to the
    // same text as reason so nothing changes in the UI.
    description: description || reason,
    date,
    addedBy: user.id,
    addedByName: user.name || user.email || "Admin",
  });

  return Response.json(
    { message: "Compensation Added Successfully", record },
    { headers: { "Cache-Control": "no-store" } }
  );
}
