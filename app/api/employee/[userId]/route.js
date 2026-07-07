import connectDb from "@/db/connectDb";
import Employee from "@/models/Employee";
import { requireAdmin } from "@/lib/auth";

export async function GET(req, { params }) {
  await connectDb();
  await requireAdmin();

  const { userId } = await params;
  const employee = await Employee.findOne({ userId }).lean();

  return Response.json(
    employee || {
      userId,
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      workingHours: 8,
      salaryAmount: 0,
    }
  );
}

export async function PUT(req, { params }) {
  await connectDb();
  await requireAdmin();

  const { userId } = await params;
  const body = await req.json();
  const { bankName, accountNumber, ifscCode, workingHours, salaryAmount } = body;

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

  return Response.json({ message: "Updated", employee: updated });
}