import connectDb from "@/db/connectDb";
import Employee from "@/models/Employee";
import User from "@/models/user";
import { requireAdmin } from "@/lib/auth";

const ALLOWED_ROLES = ["staff", "collection", "laminate"];

export async function GET() {
  await connectDb();
  await requireAdmin();

  const users = await User.find().select("_id name email role").lean();
  const staffUsers = users.filter((u) => ALLOWED_ROLES.includes(u.role));

  const employees = await Employee.find().lean();
  const employeeMap = {};
  for (const e of employees) employeeMap[e.userId] = e;

  const result = staffUsers.map((u) => {
    const uid = u._id.toString();
    const emp = employeeMap[uid] || {};
    return {
      userId: uid,
      name: u.name,
      email: u.email,
      role: u.role,
      bankName: emp.bankName || "",
      accountNumber: emp.accountNumber || "",
      ifscCode: emp.ifscCode || "",
      workingHours: emp.workingHours || 8,
      salaryAmount: emp.salaryAmount || 0,
    };
  });

  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  await connectDb();
  await requireAdmin();

  const body = await req.json();
  const { userId, bankName, accountNumber, ifscCode, workingHours, salaryAmount } = body;

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const updated = await Employee.findOneAndUpdate(
    { userId },
    {
      $set: {
        bankName: bankName ?? "",
        accountNumber: accountNumber ?? "",
        ifscCode: ifscCode ?? "",
        workingHours: workingHours ?? 8,
        salaryAmount: salaryAmount ?? 0,
      },
    },
    { upsert: true, new: true }
  );

  return Response.json({ message: "Saved", employee: updated });
}