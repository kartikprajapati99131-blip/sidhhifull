// models/Entry.js
import mongoose from "mongoose";

const ActorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false }
);

const HistorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["note", "call", "onsite", "cancel", "site-confirm"],
    required: true,
  },
  text: { type: String, default: "" },
  by: { type: ActorSchema, required: true },
  at: { type: Date, default: Date.now },
});

const EntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["customer", "mistry"], required: true },

    // Shared fields
    mobile1: { type: String, required: true, trim: true },
    mobile2: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    nextMeetingDate: { type: String, default: "" }, // stored as "YYYY-MM-DD"

    // Customer-only fields (simply left blank for mistry entries)
    siteAddress: { type: String, default: "" },
    permanentAddress: { type: String, default: "" },
    profession: { type: String, default: "" },
    mistryName: { type: String, default: "" },
    mistryNumber: { type: String, default: "" },
    architectName: { type: String, default: "" },
    architectNumber: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "site-confirmed", "cancelled"],
      default: "pending",
    },

    createdBy: { type: ActorSchema, required: true },
    history: { type: [HistorySchema], default: [] },
  },
  { timestamps: true } // gives createdAt / updatedAt automatically
);

// Fast lookups for "my entries" and for the due-today/overdue notification query
EntrySchema.index({ "createdBy.id": 1 });
EntrySchema.index({ status: 1, nextMeetingDate: 1 });

export default mongoose.models.Entry || mongoose.model("Entry", EntrySchema);