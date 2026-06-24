// models/Quotation.js

import mongoose from 'mongoose';

const QuotationSchema = new mongoose.Schema({
  clientName:     { type: String, required: true, trim: true },
  clientPhone:    { type: String, required: true, trim: true },
  clientAddress:  { type: String, trim: true },
  notes:          { type: String, trim: true },

  trackType:  { type: Number, enum: [2, 3], required: true },
  material:   { type: String, enum: ['regular', 'jindal'], required: true },
  width:      { type: Number, required: true },
  height:     { type: Number, required: true },

  rateKg:     { type: Number, required: true },
  glassRate:  { type: Number, required: true },
  labourRate: { type: Number, required: true },
  otherRate:  { type: Number, required: true },
  rLock:      { type: Number, required: true },
  rBearing:   { type: Number, required: true },
  rClot:      { type: Number, required: true },
  rRubber:    { type: Number, required: true },

  sqFt:           { type: Number },
  trackCost:      { type: Number },
  shutterCost:    { type: Number },
  interlockCost:  { type: Number },
  accessoryCost:  { type: Number },
  grandTotal:     { type: Number },
  breakdown:      { type: mongoose.Schema.Types.Mixed },

  quotationNumber: { type: String, unique: true },
}, { timestamps: true });

QuotationSchema.pre('save', async function () {
  if (!this.quotationNumber) {
    const count = await mongoose.models.Quotation.countDocuments();
    const year = new Date().getFullYear();
    this.quotationNumber = `DWC-${year}-${String(count + 1).padStart(4, '0')}`;
  }
});

// DELETE the cached model before redefining
delete mongoose.models.Quotation;

export default mongoose.model('Quotation', QuotationSchema);