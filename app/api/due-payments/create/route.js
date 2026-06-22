import dbConnect from "@/db/connectDb";
import DuePayment from "@/models/DuePayment";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ⚠️ adjust to your actual authOptions export path

export async function POST(request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "admin";

    const body = await request.json();
    const { customerName, amount, dueDate, mobile, mobile2, note, referencedBy, force } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json(
        { success: false, message: "Customer name is required" },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null || amount === "") {
      return NextResponse.json(
        { success: false, message: "Amount is required" },
        { status: 400 }
      );
    }

    if (!dueDate) {
      return NextResponse.json(
        { success: false, message: "Due date is required" },
        { status: 400 }
      );
    }

    const cleanMobile = mobile ? String(mobile).trim() : "";

    // ── Duplicate check: same mobile already has a PENDING entry ──
    // Non-admins are blocked outright. Admins get a warning and can pass
    // `force: true` to create the entry anyway.
    if (cleanMobile) {
      const existingPending = await DuePayment.findOne({
        mobile: cleanMobile,
        status: "pending",
      }).lean();

      if (existingPending && !force) {
        if (!isAdmin) {
          return NextResponse.json(
            {
              success: false,
              duplicate: true,
              message: `A pending due payment already exists for this mobile number (${existingPending.customerName}). Ask an admin to add it if this is intentional.`,
              existingEntry: existingPending,
            },
            { status: 409 }
          );
        }

        // Admin: return a warning, let the client decide to resend with force: true
        return NextResponse.json(
          {
            success: false,
            duplicate: true,
            canForce: true,
            message: `A pending due payment already exists for this mobile number (${existingPending.customerName}, ₹${existingPending.amount}). Add anyway?`,
            existingEntry: existingPending,
          },
          { status: 409 }
        );
      }
    }

    const newEntry = await DuePayment.create({
      customerName: customerName.trim(),
      amount: Number(amount),
      dueDate: new Date(dueDate),
      mobile: cleanMobile,
      mobile2: mobile2 ? String(mobile2).trim() : "",
      note: note ? String(note).trim() : "",
      referencedBy: referencedBy ? String(referencedBy).trim() : "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Due payment created successfully",
        data: newEntry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating due payment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create due payment",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
