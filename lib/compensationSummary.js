import User from "@/models/user";
import Employee from "@/models/Employee";
import Compensation from "@/models/Compensation";

// Same staff population salary uses — compensation only ever applies to
// these roles, so the overview list should match the salary employee list.
const ALLOWED_ROLES = ["staff", "collection", "laminate"];

/**
 * Rolls Compensation records up per-employee, exactly the way
 * computeSalarySummary() rolls up attendance + transactions per-employee.
 *
 * Returns one entry per staff user with: userId, name, email, role,
 * totalHours (decimal), totalMinutes (raw, for exact +Xh Ym display),
 * recordsCount, lastDate, and the raw records (sorted latest first) —
 * same "records" ready to be grouped by month on the client.
 */
export async function computeCompensationSummary({ from, to, userId } = {}) {
  const userQuery = userId ? { _id: userId } : {};
  const users = await User.find(userQuery).select("_id name email role").lean();
  const staffUsers = users.filter((u) => ALLOWED_ROLES.includes(u.role));

  const employees = await Employee.find(userId ? { userId } : {}).lean();
  const employeeMap = {};
  for (const e of employees) employeeMap[e.userId] = e;

  const dateFilter = {};
  if (from) dateFilter.$gte = from;
  if (to) dateFilter.$lte = to;

  const results = [];

  for (const user of staffUsers) {
    const uid = user._id.toString();
    const emp = employeeMap[uid] || {};

    const query = { employeeId: uid };
    if (from || to) query.date = dateFilter;

    const records = await Compensation.find(query).sort({ date: -1, createdAt: -1 }).lean();

    const totalMinutes = records.reduce(
      (sum, r) => sum + (r.hours || 0) * 60 + (r.minutes || 0),
      0
    );

    results.push({
      userId: uid,
      name: user.name,
      email: user.email,
      role: user.role,
      workingHours: emp.workingHours || 8,
      totalHours: totalMinutes / 60,
      totalHM: { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 },
      recordsCount: records.length,
      lastDate: records[0]?.date || null,
      records,
    });
  }

  return results;
}
