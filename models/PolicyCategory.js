import mongoose from "mongoose";

const PolicyCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    // lucide-react icon name, e.g. "Users", "Shield", "Briefcase", "FileText"
    icon: {
      type: String,
      default: "FileText",
    },
    // hex color used for badges / accents in the UI
    color: {
      type: String,
      default: "#6366f1",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.PolicyCategory ||
  mongoose.model("PolicyCategory", PolicyCategorySchema);
