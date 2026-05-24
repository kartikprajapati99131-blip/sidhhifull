import connectDB from "@/db/connectDb";
import contact from "@/models/contact";

export async function POST(req) {
  await connectDB();

  const data = await req.json();

  const exists = await contact.findOne({
    phone: data.phone,
    message: data.message,
  });

  if (exists) {
    return Response.json({ success: false, message: "Already sent" });
  }

  const doc = await contact.create(data);

  return Response.json({
    success: true,
    contact: { ...doc.toObject(), _id: doc._id.toString() },
  });
}