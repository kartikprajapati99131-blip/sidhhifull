import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number },
    description: { type: String },
    type: { type: String },
    image: {url: String,public_id: String,},

    createdBy: String, // optional (admin email)
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", productSchema);