import mongoose from "mongoose";

const ActorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false }
);

const RouteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Lowercased copy of `name`, used for case-insensitive duplicate
    // prevention ("Deesa Highway" / "deesa highway" / "DEESA HIGHWAY" are
    // all the same route). A unique index on this field is the source of
    // truth for uniqueness; the app-level check in the API route is a
    // fast pre-check for a friendlier error message.
    normalizedName: { type: String, required: true, trim: true, lowercase: true },
    createdBy: { type: ActorSchema, required: true },
  },
  { timestamps: true }
);

RouteSchema.index({ normalizedName: 1 }, { unique: true });

// Same dev-mode cache-buster pattern as models/Entry.js, so schema edits
// take effect on hot-reload without having to restart `next dev`.
if (process.env.NODE_ENV !== "production" && mongoose.models.Route) {
  delete mongoose.models.Route;
}

export default mongoose.models.Route || mongoose.model("Route", RouteSchema);
