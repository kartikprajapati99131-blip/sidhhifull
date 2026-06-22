import mongoose from "mongoose";

// Stores the admin-managed list of "Referenced By" names that show up
// as selectable options on the Add/Edit Due Payment forms.
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
