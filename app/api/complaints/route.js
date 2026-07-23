import dbConnect from "@/db/connectDb";
import Complaint, { PRODUCTS, ASSIGNEES } from "@/models/Complaint";
import { NextResponse } from "next/server";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// GET /api/complaints?status=&product=&assignedTo=&search=
//
// status: pending | call-site | need-visit | follow-up | completed | non-visiting | all
// Default (no status, or "all"): every complaint, active ones sorted by
// followUpDate ascending (soonest first, nulls last), completed ones by
// completedAt desc, with active complaints listed before completed ones.
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const product = searchParams.get("product");
    const assignedTo = searchParams.get("assignedTo");
    const search = searchParams.get("search");

    const query = {};

    if (status === "non-visiting") {
      query.status = { $ne: "completed" };
      query.lastUpdatedAt = { $lte: new Date(Date.now() - SEVEN_DAYS_MS) };
    } else if (status === "completed") {
      query.status = "completed";
    } else if (status !== "all" && status) {
      query.status = status;
    }

    if (product) query.product = product;
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      const term = search.trim();
      if (term) {
        query.$or = [
          { customerName: { $regex: term, $options: "i" } },
          { mobileNumber: { $regex: term, $options: "i" } },
        ];
      }
    }

    let complaints;

    if (status === "completed") {
      complaints = await Complaint.find(query).sort({ completedAt: -1 }).lean();
    } else if (status === "all") {
      // Active complaints first (soonest follow-up first, nulls last), then
      // completed complaints (most recently completed first).
      const [active, completed] = await Promise.all([
        Complaint.find({ ...query, status: { ...(query.status || {}), $ne: "completed" } })
          .sort({ followUpDate: 1, createdAt: -1 })
          .lean(),
        Complaint.find({ ...query, status: "completed" })
          .sort({ completedAt: -1 })
          .lean(),
      ]);
      // followUpDate: null sorts first in Mongo ascending order, so push
      // nulls to the end manually.
      active.sort((a, b) => {
        if (!a.followUpDate && !b.followUpDate) return new Date(b.createdAt) - new Date(a.createdAt);
        if (!a.followUpDate) return 1;
        if (!b.followUpDate) return -1;
        return new Date(a.followUpDate) - new Date(b.followUpDate);
      });
      complaints = [...active, ...completed];
    } else {
      complaints = await Complaint.find(query).sort({ createdAt: -1 }).lean();
      complaints.sort((a, b) => {
        if (!a.followUpDate && !b.followUpDate) return new Date(b.createdAt) - new Date(a.createdAt);
        if (!a.followUpDate) return 1;
        if (!b.followUpDate) return -1;
        return new Date(a.followUpDate) - new Date(b.followUpDate);
      });
    }

    return NextResponse.json({ success: true, data: complaints }, { status: 200 });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch complaints", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/complaints
// body: { customerName, mobileNumber, address, product, assignedTo, followUpDate, remark? }
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { customerName, mobileNumber, address, product, assignedTo, followUpDate, remark } = body;

    if (!customerName?.trim() || !mobileNumber?.trim() || !address?.trim()) {
      return NextResponse.json(
        { success: false, message: "Customer name, mobile number and address are required" },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      return NextResponse.json(
        { success: false, message: "Mobile number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    if (!PRODUCTS.includes(product)) {
      return NextResponse.json(
        { success: false, message: "Invalid product" },
        { status: 400 }
      );
    }

    if (!ASSIGNEES.includes(assignedTo)) {
      return NextResponse.json(
        { success: false, message: "Invalid assignee" },
        { status: 400 }
      );
    }

    if (!followUpDate) {
      return NextResponse.json(
        { success: false, message: "Follow-up date is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const initialRemark = remark?.trim() || "Complaint registered";
    const initialFollowUpDate = new Date(followUpDate);

    const complaint = await Complaint.create({
      customerName: customerName.trim(),
      mobileNumber: mobileNumber.trim(),
      address: address.trim(),
      product,
      assignedTo,
      status: "pending",
      remark: initialRemark,
      followUpDate: initialFollowUpDate,
      lastUpdatedAt: now,
      history: [{ status: "pending", remark: initialRemark, followUpDate: initialFollowUpDate, at: now }],
    });

    return NextResponse.json({ success: true, data: complaint }, { status: 201 });
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create complaint", error: error.message },
      { status: 500 }
    );
  }
}