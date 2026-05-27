import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g. "18mm", '4 inch', 'Pel Dhar'
    price: { type: Number, required: true },
    unit:  { type: String },                 // e.g. "sqft", "piece", "sheet"
    stock: { type: Number, default: 0 },
  },
  { _id: false }
);

// Each image in the gallery
const imageSchema = new mongoose.Schema(
  {
    url:       { type: String, required: true },
    // ✅ FIX: public_id is no longer required so legacy docs (and Cloudinary
    //    uploads that didn't store public_id) don't fail validation on save.
    public_id: { type: String, default: "" },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // Base price (used when no variants exist)
    price:     { type: Number },
    priceUnit: { type: String }, // e.g. "sqft" for wood

    description: { type: String },

    type: {
      type: String,
      enum: [
        "Laminate",
        "Plywood",
        "Glass",
        "UPVC",
        "Hardware",
        "AluminiumSection",
        "Lock",
        "Handle",
        "Hinges",
        "Wood",
      ],
      required: true,
    },

    variants: [variantSchema],

    tags: {
      type: [String],
      enum: ["best_seller", "featured", "new_arrival"],
      default: [],
    },

    // ─── Multi-image gallery ───────────────────────────────────────────────
    // images[0] is treated as the primary / cover image throughout the UI.
    // Max 6 images enforced at the application layer (not schema level so
    // existing single-image docs stay valid after migration).
    images: {
      type:    [imageSchema],
      default: [],
    },

    // ─── Legacy single-image field (kept for backward compat, read-only) ──
    // Old documents in MongoDB may have this field. The UI now only reads
    // from `images[]`, falling back to `image.url` for display. New saves
    // never write to this field.
    image: {
      url:       { type: String },
      public_id: { type: String },
    },
  },
  {
    timestamps: true,
    // ✅ FIX: toJSON transform guarantees `images` is always an array even
    //    for old DB documents that were saved before the field existed.
    //    This means product.images is NEVER undefined anywhere in the app.
    toJSON: {
      transform(doc, ret) {
        if (!Array.isArray(ret.images)) {
          ret.images = [];
        }
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        if (!Array.isArray(ret.images)) {
          ret.images = [];
        }
        return ret;
      },
    },
  }
);

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
