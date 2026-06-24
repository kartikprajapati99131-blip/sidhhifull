// models/PriceList.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    code:        { type: String, required: true, trim: true },
    thickness:   { type: String, trim: true, default: "" },
    rate:        { type: String, required: true, trim: true, default: "" },
    netPrice:    { type: Number, required: true, default: 0 },
    dp:          { type: Number, required: true, default: 0 },
    createdAt:   { type: Date, default: Date.now },
  },
  { _id: true }
);

const SubCategorySchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    products: [ProductSchema],
  },
  { _id: true }
);

const PriceListSchema = new mongoose.Schema(
  {
    companyName:    { type: String, required: true, trim: true, unique: true },
    subCategories:  [SubCategorySchema],
  },
  { timestamps: true }
);

// Prevent model re-compilation in Next.js hot-reload
const PriceList =
  mongoose.models.PriceList || mongoose.model("PriceList", PriceListSchema);

export default PriceList;