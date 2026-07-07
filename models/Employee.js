import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    bankName: { type: String, default: "", trim: true },
    accountNumber: { type: String, default: "", trim: true },
    ifscCode: { type: String, default: "", trim: true },
    workingHours: { type: Number, default: 8 },
    salaryAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Employee ||
  mongoose.model("Employee", employeeSchema);