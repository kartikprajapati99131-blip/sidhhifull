// app/api/brand/[id]/route.js
import connectDB from "@/db/connectDb";
import Brand from "@/models/brand";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const data = await req.json();

    const { name, type, logo, subCategories } = data;

    const brand = await Brand.findByIdAndUpdate(
      id,
      {
        name: name?.trim(),
        type,
        logo: logo || { url: "", public_id: "" },
        subCategories: Array.isArray(subCategories) ? subCategories.filter(Boolean) : [],
      },
      { new: true }
    );

    if (!brand) {
      return Response.json({ success: false, message: "Brand not found" }, { status: 404 });
    }

    return Response.json({ success: true, brand });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) {
      return Response.json({ success: false, message: "Brand not found" }, { status: 404 });
    }

    return Response.json({ success: true, message: "Brand deleted" });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}