import dbConnect from "@/db/connectDb";
import DuePayment from "@/models/DuePayment";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { customerName, amount, dueDate, mobile, note } = body;

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

    const newEntry = await DuePayment.create({
      customerName: customerName.trim(),
      amount: Number(amount),
      dueDate: new Date(dueDate),
      mobile: mobile ? String(mobile).trim() : "",
      note: note ? String(note).trim() : "",
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