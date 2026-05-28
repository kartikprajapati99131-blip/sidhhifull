// app/api/brand/create/route.js
import connectDB from "@/db/connectDb";
import Brand from "@/models/brand";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();

    const { name, type, logo, subCategories } = data;

    if (!name?.trim()) {
      return Response.json({ success: false, message: "Brand name is required" }, { status: 400 });
    }
    if (!type) {
      return Response.json({ success: false, message: "Product type is required" }, { status: 400 });
    }

    const existing = await Brand.findOne({ name: name.trim(), type });
    if (existing) {
      return Response.json({ success: false, message: "Brand already exists for this type" }, { status: 400 });
    }

    const brand = await Brand.create({
      name: name.trim(),
      type,
      logo: logo || { url: "", public_id: "" },
      subCategories: Array.isArray(subCategories) ? subCategories.filter(Boolean) : [],
    });

    return Response.json({ success: true, brand });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}