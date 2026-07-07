import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    remark: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: 1 });

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);