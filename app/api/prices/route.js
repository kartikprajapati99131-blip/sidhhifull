// app/api/prices/route.js
// GET  → return the current global price settings (or defaults if none saved)
// PUT  → update and return the saved price settings

import connectDB from '@/db/connectDb';
import PriceSettings from '@/models/PriceSettings';

const DEFAULTS = {
  rateKg: 315, glassRate: 72, labourRate: 50, otherRate: 200,
  rLock: 135, rBearing: 50, rClot: 18, rRubber: 75,
};

export async function GET() {
  await connectDB();
  const doc = await PriceSettings.findOne().lean();
  return Response.json(doc || DEFAULTS);
}

export async function PUT(req) {
  try {
    await connectDB();
    const body = await req.json();
    const fields = ['rateKg', 'glassRate', 'labourRate', 'otherRate', 'rLock', 'rBearing', 'rClot', 'rRubber'];
    const update = {};
    for (const f of fields) {
      if (body[f] !== undefined) update[f] = Number(body[f]);
    }
    const doc = await PriceSettings.findOneAndUpdate(
      {},
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return Response.json(doc);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
