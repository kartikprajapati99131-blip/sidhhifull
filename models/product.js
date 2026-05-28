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

    // ✅ FIX: public_id is no longer required so legacy docs
    // and Cloudinary uploads without public_id still work
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

    description: { type: String, default: "" },

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

    // ── NEW FIELDS ─────────────────────────────────────────────
    brand: {
      type: String,
      default: "",
      trim: true,
    },

    subCategory: {
      type: String,
      default: "",
      trim: true,
    },

    variants: [variantSchema],

    tags: {
      type: [String],
      enum: ["best_seller", "featured", "new_arrival"],
      default: [],
    },

    // ─── Multi-image gallery ──────────────────────────────────
    // images[0] is treated as the primary / cover image
    images: {
      type: [imageSchema],
      default: [],
    },

    // ─── Legacy single-image field (backward compatibility) ──
    image: {
      url:       { type: String },
      public_id: { type: String },
    },
  },
  {
    timestamps: true,

    // ✅ Ensure images is always an array
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