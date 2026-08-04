import Compensation from "@/models/Compensation";

/**
 * Fetches Compensation records for an employee (optionally scoped to a
 * date range) and rolls them up into a total, in hours.
 *
 * Does NOT touch attendance/worked-hours math — callers add this total
 * on top of their own existing worked-hours calculation.
 */
export async function getCompensationSummary({ employeeId, from, to } = {}) {
  const query = {};
  if (employeeId) query.employeeId = employeeId;

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }

  const records = await Compensation.find(query).sort({ date: -1 }).lean();

  const totalMinutes = records.reduce(
    (sum, r) => sum + (r.hours || 0) * 60 + (r.minutes || 0),
    0
  );

  return {
    records,
    compensationHours: totalMinutes / 60,
  };
}
