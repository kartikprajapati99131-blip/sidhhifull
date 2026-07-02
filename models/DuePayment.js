import mongoose from "mongoose";

const DuePaymentSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    mobile: { type: String, default: null, sparse: true },  // ✅ fixed unique index
    mobile2: { type: String, default: "" },                 // ✅ ADDED: secondary mobile
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    // --- Follow-up fields ---
    previousDueDate: { type: Date, default: null },
    updatedDueDate: { type: Date, default: null },
    lastFollowUpAt: { type: Date, default: null },
    reminderShown: { type: Boolean, default: false },

    // --- No-Answer tracking (any dueDate change resets this) ---
    lastDueDateChangeAt: { type: Date, default: null },

    // --- Full reschedule trail (call vs onsite) for the detail popup ---
    rescheduleHistory: [
      {
        type: { type: String, enum: ["call", "onsite"] },
        previousDueDate: Date,
        newDueDate: Date,
        changedAt: { type: Date, default: Date.now },
      },
    ],
    referencedBy: {
      type: String,
      default: "",
      trim: true,
    },

    // Track regular edits — used by TodayUpdatedEntries for 4-day "edited" badge
    lastEditedAt: { type: Date, default: null },

    // Completion details
    completedAt: { type: Date, default: null },
    paymentMethod: { type: String, enum: ["cash", "check", null], default: null },
    amountGiven: { type: Number, default: null },
    originalAmount: { type: Number, default: null },
    accountStatus: { type: String, enum: ["closed", "continue", null], default: null },
    remainingAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const DuePayment =
  mongoose.models.DuePayment ||
  mongoose.model("DuePayment", DuePaymentSchema);

export default DuePayment;
