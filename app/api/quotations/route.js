// app/api/quotations/route.js

import connectDB from '@/db/connectDb';
import Quotation from '@/models/Quotation';
import { calcDomal } from '@/lib/calc';

export async function GET(req) {
  await connectDB();
  const list = await Quotation.find({}, 'quotationNumber clientName clientPhone clientAddress grandTotal trackType material width height createdAt')
    .sort({ createdAt: -1 })
    .lean();
  return Response.json(list);
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      clientName, clientPhone, clientAddress, notes,
      trackType, material, width, height,
      rateKg, glassRate, labourRate, otherRate,
      rLock, rBearing, rClot, rRubber,
    } = body;

    const { rows, trackCost, shutterCost, interlockCost, accessoryCost, grandTotal, sqFt } =
      calcDomal({ trackType, material, width, height, rateKg, glassRate, labourRate, otherRate, rLock, rBearing, rClot, rRubber });

    const doc = await Quotation.create({
      clientName, clientPhone, clientAddress, notes,
      trackType, material, width, height,
      rateKg, glassRate, labourRate, otherRate,
      rLock, rBearing, rClot, rRubber,
      sqFt, trackCost, shutterCost, interlockCost, accessoryCost, grandTotal,
      breakdown: rows,
    });

    return Response.json(doc, { status: 201 });
  } catch (err) {
    console.error('POST /api/quotations error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}