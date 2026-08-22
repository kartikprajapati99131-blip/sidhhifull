import mongoose from "mongoose";

// Sittos / Magnus / CPL — multi-select tags picked when a "Confirm site" or
// "Mark visited" action is logged. Kept in one place so the schema and the
// action route both validate against the same list.
export const VISIT_TAGS = ["Sittos", "Magnus", "CPL"];

// Fixed set of referrers for the "Referenced By" customer field. Unlike
// Route (admin-managed, dynamic master data), these values are decided
// and fixed — not editable through the app. Kept in one place so the
// schema and the API routes validate against the same list.
export const REFERENCED_BY_OPTIONS = ["Haresh bhai", "Sanjay bhai"];

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
    enum: ["note", "call", "onsite", "visited", "cancel", "site-confirm", "edit"],
    required: true,
  },
  text: { type: String, default: "" },
  // Tags picked on THIS specific action (site-confirm / visited). Empty for
  // every other history type.
  tags: { type: [String], enum: VISIT_TAGS, default: [] },
  by: { type: ActorSchema, required: true },
  at: { type: Date, default: Date.now },
});

const EntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["customer", "mistry"], required: true },

    // Shared fields
    mobile1: { type: String, required: true, trim: true },
    mobile2: { type: String, trim: true, default: "" },
    name: { type: String, required: true, trim: true },
    nextMeetingDate: { type: String, default: "" }, // stored as "YYYY-MM-DD"

    // Customer-only fields (left blank for mistry entries)
    siteAddress: { type: String, default: "" },
    permanentAddress: { type: String, default: "" },
    profession: { type: String, default: "" },
    mistryName: { type: String, default: "" },
    mistryNumber: { type: String, default: "" },
    architectName: { type: String, default: "" },
    architectNumber: { type: String, default: "" },

    // Customer-only. References a Route master document (see
    // models/Route.js). Optional — existing entries created before this
    // field existed simply have route: null, which the UI renders as
    // "No route" instead of treating the record as invalid.
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null },

    // Customer-only. Fixed list (see REFERENCED_BY_OPTIONS above), not
    // admin-managed. "" (default) means "not set" — same convention as
    // the other optional customer-only string fields above — so existing
    // entries created before this field existed don't need a migration.
    referencedBy: { type: String, enum: [...REFERENCED_BY_OPTIONS, ""], default: "" },

    status: {
      type: String,
      enum: ["pending", "site-confirmed", "cancelled"],
      default: "pending",
    },

    // Cumulative Sittos/Magnus/CPL tags for this entry — the union of every
    // tag ever picked on a "site-confirm" or "visited" action. This is what
    // the tag filter (All/Sittos/Magnus/CPL) reads.
    tags: { type: [String], enum: VISIT_TAGS, default: [] },

    createdBy: { type: ActorSchema, required: true },
    history: { type: [HistorySchema], default: [] },
  },
  { timestamps: true } // gives createdAt / updatedAt automatically
);

// Fast lookups for "my entries", the due-today/overdue query, and the
// Sittos/Magnus/CPL tag filter.
EntrySchema.index({ "createdBy.id": 1 });
EntrySchema.index({ status: 1, nextMeetingDate: 1 });
EntrySchema.index({ mobile1: 1 });
EntrySchema.index({ tags: 1 });
// Powers the Route filter and the "is this route in use" check that runs
// before a route can be deleted.
EntrySchema.index({ route: 1 });
// Powers the Referenced By filter.
EntrySchema.index({ referencedBy: 1 });

// ── Dev-mode cache buster ───────────────────────────────────────────────
// Next.js dev servers hot-reload most files, but `mongoose.models.Entry`
// is cached for the lifetime of the Node process. If you edit this schema
// (add an enum value, add a field, etc.) while `next dev` is still running,
// Mongoose will silently keep validating against the OLD compiled schema
// until the process is fully restarted. This forces a fresh compile of the
// schema on every reload in development, so schema edits actually take
// effect without you having to remember to kill the server every time.
if (process.env.NODE_ENV !== "production" && mongoose.models.Entry) {
  delete mongoose.models.Entry;
}

export default mongoose.models.Entry || mongoose.model("Entry", EntrySchema);