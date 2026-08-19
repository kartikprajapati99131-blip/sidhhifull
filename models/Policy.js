import mongoose from "mongoose";

const RuleSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const HistorySchema = new mongoose.Schema(
  {
    action: { type: String, default: "updated" }, // created | updated | archived | restored
    changedBy: { type: String, default: "" },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const PolicySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Policy title is required"],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PolicyCategory",
      required: [true, "Category is required"],
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    // The actual policy rules/clauses, kept as an ordered list so they can be
    // rendered as a numbered list on screen and in the exported PDF.
    rules: {
      type: [RuleSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "A policy must have at least one rule",
      },
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "active",
      index: true,
    },
    version: {
      type: String,
      default: "1.0",
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    tags: [{ type: String, trim: true }],
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
    history: [HistorySchema],
  },
  { timestamps: true }
);

PolicySchema.index({ title: "text", description: "text", "rules.text": "text" });

export default mongoose.models.Policy || mongoose.model("Policy", PolicySchema);
