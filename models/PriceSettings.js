// models/PriceSettings.js
// Single-document store for global price defaults.
// Only one document ever exists (singleton pattern).

import mongoose from 'mongoose';

const PriceSettingsSchema = new mongoose.Schema({
  rateKg:     { type: Number, default: 315 },
  glassRate:  { type: Number, default: 72 },
  labourRate: { type: Number, default: 50 },
  otherRate:  { type: Number, default: 200 },
  rLock:      { type: Number, default: 135 },
  rBearing:   { type: Number, default: 50 },
  rClot:      { type: Number, default: 18 },
  rRubber:    { type: Number, default: 75 },
}, { timestamps: true });

delete mongoose.models.PriceSettings;
export default mongoose.model('PriceSettings', PriceSettingsSchema);
