import connectDb from "@/db/connectDb";
import { getSessionUser, canManageCompensation } from "@/lib/compensationAuth";
import { computeCompensationSummary } from "@/lib/compensationSummary";

// ─────────────────────────────────────────────
// GET — per-employee compensation summary (mirrors /api/salary/summary).
//   Admin / Sub Admin : all employees, or one via ?userId=
//   Employee          : always forced to their own id — same server-side
//                        enforcement rule already used in /api/compensation.
// ─────────────────────────────────────────────
export async function GET(req) {
  await connectDb();

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isManager = canManageCompensation(user);

  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  // Never trust the frontend for scope — same rule as the list route.
  let userId = searchParams.get("userId") || undefined;
  if (!isManager) userId = user.id;

  const data = await computeCompensationSummary({ from, to, userId });

  return Response.json(
    { data },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}
