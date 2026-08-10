import mongoose from "mongoose";

export const PRODUCTS = ["Laminate", "Venner", "Plywood", "Flush Door", "Glass", "Hardware"];
export const ASSIGNEES = [
  "Sanjay Bhai",
  "Haresh Bhai",
  "Vijay Bhai",
  "Bharat Bhai",
  "Nitin Bhai",
  "Chetan Bhai",
];
export const STATUSES = ["pending", "call-site", "need-visit", "follow-up", "completed"];

const HistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    remark: { type: String, default: "" },
    followUpDate: { type: Date, default: null },
    at: { type: Date, default: Date.now },
    // Name of the person (from their login session) who made this update.
    updatedBy: { type: String, default: "Unknown User", trim: true },
  },
  { _id: false }
);

const ComplaintSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    product: { type: String, enum: PRODUCTS, required: true },
    assignedTo: { type: String, enum: ASSIGNEES, required: true },

    status: { type: String, enum: STATUSES, default: "pending" },
    remark: { type: String, default: "" },
    followUpDate: { type: Date, default: null },

    lastUpdatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },

    // Who registered the complaint, and who most recently touched it —
    // both taken from the logged-in user's session name, never typed in
    // by hand, so the audit trail can't be spoofed by a stray text field.
    registeredBy: { type: String, default: "Unknown User", trim: true },
    lastUpdatedBy: { type: String, default: "Unknown User", trim: true },
    completedBy: { type: String, default: null, trim: true },

    history: { type: [HistorySchema], default: [] },
  },
  { timestamps: true }
);

ComplaintSchema.index({ status: 1, followUpDate: 1 });
ComplaintSchema.index({ lastUpdatedAt: 1 });
ComplaintSchema.index({ mobileNumber: 1 });

// ── Dev-mode cache buster ───────────────────────────────────────────────
// Next.js dev servers hot-reload most files, but `mongoose.models.Complaint`
// is cached for the lifetime of the Node process. If you edit this schema
// (add an enum value, add a field, etc.) while `next dev` is still running,
// Mongoose will silently keep validating against the OLD compiled schema
// until the process is fully restarted. This forces a fresh compile of the
// schema on every reload in development, so schema edits actually take
// effect without you having to remember to kill the server every time.
if (process.env.NODE_ENV !== "production" && mongoose.models.Complaint) {
  delete mongoose.models.Complaint;
}

export default mongoose.models.Complaint || mongoose.model("Complaint", ComplaintSchema);
