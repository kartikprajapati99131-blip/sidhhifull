import mongoose from "mongoose";

const ReferenceNameSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true }
);

const ReferenceName =
  mongoose.models.ReferenceName ||
  mongoose.model("ReferenceName", ReferenceNameSchema);

export default ReferenceName;