// app/api/quotations/[id]/route.js

import connectDB from '@/db/connectDb';
import Quotation from '@/models/Quotation';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const doc = await Quotation.findById(id).lean();
    if (!doc) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(doc);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    await Quotation.findByIdAndDelete(id);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}