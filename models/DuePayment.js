import mongoose from "mongoose";

// Add these new fields to your existing DuePayment schema.
// Copy the new fields below into your current model file at @/models/DuePayment.js

const DuePaymentSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    mobile: { type: String, default: "" },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    // --- Existing follow-up fields ---
    previousDueDate: { type: Date, default: null },
    updatedDueDate: { type: Date, default: null },
    lastFollowUpAt: { type: Date, default: null },
    reminderShown: { type: Boolean, default: false },

    // ✅ NEW: Track regular edits (date/amount/name changes)
    // Used by TodayUpdatedEntries to show "edited" badge for 4 days
    lastEditedAt: { type: Date, default: null },

    // ✅ NEW: Completion details
    completedAt: { type: Date, default: null },
    paymentMethod: { type: String, enum: ["cash", "check", null], default: null },
    amountGiven: { type: Number, default: null },       // how much was actually collected
    originalAmount: { type: Number, default: null },    // amount before partial payment
    accountStatus: { type: String, enum: ["closed", "continue", null], default: null },
    remainingAmount: { type: Number, default: 0 },      // leftover if "continue"
  },
  { timestamps: true }
);

const DuePayment =
  mongoose.models.DuePayment ||
  mongoose.model("DuePayment", DuePaymentSchema);

export default DuePayment;
