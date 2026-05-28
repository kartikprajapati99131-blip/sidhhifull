// models/brand.js
import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "Plywood","Wood","Handle","Glass","Laminate",
        "UPVC","Hardware","AluminiumSection","Lock","Hinges",
      ],
    },
    logo: {
      url:       { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    subCategories: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Brand || mongoose.model("Brand", BrandSchema);