import connectDb from "@/db/connectDb";
import Compensation from "@/models/Compensation";
import { getSessionUser, canManageCompensation } from "@/lib/compensationAuth";

// ─────────────────────────────────────────────
// GET — list compensation records
//   Admin / Sub Admin : all records, optional employeeId / search / date filters
//   Employee          : only their own records — server-enforced, frontend
//                        params for employeeId are ignored for non-managers.
// ─────────────────────────────────────────────
export async function GET(req) {
  await connectDb();

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isManager = canManageCompensation(user);

  const query = {};

  if (isManager) {
    const employeeId = searchParams.get("employeeId");
    if (employeeId) query.employeeId = employeeId;

    const search = searchParams.get("search");
    if (search) query.employeeName = { $regex: search, $options: "i" };
  } else {
    // Never trust the frontend role/id — always scope to the logged-in user.
    query.employeeId = user.id;
  }

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }

  const records = await Compensation.find(query)
    .sort({ date: -1, createdAt: -1 }) // latest first
    .lean();

  return Response.json(
    { records },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}
