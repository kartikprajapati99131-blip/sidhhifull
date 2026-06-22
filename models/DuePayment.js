import mongoose from "mongoose";

const DuePaymentSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    mobile: {
      type: String,
      default: "",
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    reminderShown: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Holds the most recent follow-up date selected from the reminder popup
    updatedDueDate: {
      type: Date,
      default: null,
    },
    // Stores the dueDate value right before a follow-up update overwrites it.
    // Needed so "Today's Updated Follow Ups" can show old vs new due date.
    previousDueDate: {
      type: Date,
      default: null,
    },
    // Timestamp of the last time this entry went through the
    // "Done Calling -> Next Follow Up Date" flow. Used to find entries
    // that were rescheduled today.
    lastFollowUpAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

export default mongoose.models.DuePayment ||
  mongoose.model("DuePayment", DuePaymentSchema);