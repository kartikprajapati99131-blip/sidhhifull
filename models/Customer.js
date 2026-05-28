import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    mo1:        { type: String, required: true, unique: true, trim: true },
    mo2:        { type: String, default: "", trim: true },
    category:   { type: String, default: "", trim: true },
    firstName:  { type: String, required: true, trim: true },
    middleName: { type: String, default: "", trim: true },
    lastName:   { type: String, required: true, trim: true },
    address1:   { type: String, default: "", trim: true },
    address2:   { type: String, default: "", trim: true },
    area:       { type: String, default: "", trim: true },
    city:       { type: String, default: "", trim: true },
    district:   { type: String, default: "", trim: true },
    state:      { type: String, default: "", trim: true },
    pincode:    { type: String, default: "", trim: true },
    bloodGroup: { type: String, default: "", trim: true },
    religion:   { type: String, default: "", trim: true },
    createdBy:  { type: String, default: "accounts" },
  },
  { timestamps: true }
);

// Sparse index on mo2 so empty strings don't collide
CustomerSchema.index({ mo2: 1 }, { sparse: true, partialFilterExpression: { mo2: { $gt: "" } } });

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);