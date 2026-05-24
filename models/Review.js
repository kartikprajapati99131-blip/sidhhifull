// models/Review.js
import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
    staffId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating:        { type: Number, min: 1, max: 5, required: true },
    comment:       { type: String, default: "" },
    reviewerName:  { type: String, required: true },   // 👈 new
    reviewerPhone: { type: String, required: true },   // 👈 new
}, { timestamps: true });

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);