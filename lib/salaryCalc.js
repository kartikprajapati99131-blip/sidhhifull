import Attendance from "@/models/Attendance";
import Transaction from "@/models/Transaction";
import Employee from "@/models/Employee";
import User from "@/models/user";
import { getCompensationSummary } from "@/lib/compensationCalc";

const ALLOWED_ROLES = ["staff", "collection", "laminate"];

export async function computeSalarySummary({ from, to, userId }) {
  const userQuery = userId ? { _id: userId } : {};
  const users = await User.find(userQuery)
    .select("_id name email role")
    .lean();

  const staffUsers = users.filter((u) =>
    ALLOWED_ROLES.includes(u.role)
  );

  const employees = await Employee.find(userId ? { userId } : {}).lean();
  const employeeMap = {};

  for (const e of employees) {
    employeeMap[e.userId] = e;
  }

  const dateFilter = {};
  if (from) dateFilter.$gte = from;
  if (to) dateFilter.$lte = to;

  const results = [];

  for (const user of staffUsers) {
    const uid = user._id.toString();
    const emp = employeeMap[uid] || {};

    const workingHours = emp.workingHours || 8;
    const salaryAmount = emp.salaryAmount || 0;

    // Attendance
    const attendanceQuery = { userId: uid };
    if (from || to) attendanceQuery.date = dateFilter;

    const attendanceRecords = await Attendance.find(attendanceQuery).lean();

    const totalHours = attendanceRecords.reduce(
      (sum, record) => sum + (record.totalHours || 0),
      0
    );

    // Transactions
    const transactionQuery = { userId: uid };
    if (from || to) transactionQuery.date = dateFilter;

    const transactions = await Transaction.find(transactionQuery)
      .sort({ date: -1 })
      .lean();

    const credit = transactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    const debit = transactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    const adjustments = credit - debit;

    // Compensation Hours
    const { compensationHours } = await getCompensationSummary({
      employeeId: uid,
      from,
      to,
    });

    const totalEffectiveHours = totalHours + compensationHours;

    // Salary Calculation
    const dailyRate = salaryAmount / 26;
    const hourlyRate = workingHours > 0 ? dailyRate / workingHours : 0;

    // Round to nearest rupee (>=0.5 rounds up, <0.5 rounds down)
    const baseIncomeRaw = hourlyRate * totalEffectiveHours;
    const baseIncome = Math.round(baseIncomeRaw);
    const totalIncome = Math.round(baseIncomeRaw + adjustments);

    results.push({
      userId: uid,
      name: user.name,
      email: user.email,
      role: user.role,

      bankName: emp.bankName || "",
      accountNumber: emp.accountNumber || "",
      ifscCode: emp.ifscCode || "",

      salaryAmount,
      workingHours,

      totalHours,
      compensationHours,
      totalEffectiveHours,

      dailyRate,
      hourlyRate,

      baseIncome,

      credit,
      debit,
      adjustments,

      totalIncome,

      transactions,
    });
  }

  return results;
}