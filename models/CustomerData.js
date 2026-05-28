import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    mobile1: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    },
    mobile2: {
      type: String,
      default: "",
      trim: true,
      match: [/^(\d{10})?$/, "Mobile number must be 10 digits"],
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    address1: {
      type: String,
      trim: true,
      default: "",
    },
    address2: {
      type: String,
      trim: true,
      default: "",
    },
    area: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    district: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
      match: [/^(\d{6})?$/, "Pincode must be 6 digits"],
    },
    bloodGroup: {
      type: String,
      enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "",
    },
    religion: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

CustomerSchema.index({ mobile1: 1 });
CustomerSchema.index({ mobile2: 1 });
CustomerSchema.index({ city: 1 });
CustomerSchema.index({ bloodGroup: 1 });
CustomerSchema.index({ religion: 1 });

// ✅ FIXED: use "CustomerData" not "Customer" to avoid conflict with other models
export default mongoose.models.CustomerData ||
  mongoose.model("CustomerData", CustomerSchema);