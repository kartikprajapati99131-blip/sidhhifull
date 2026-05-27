"use client";

import { useState } from "react";
import { CldUploadButton } from "next-cloudinary";
import { ToastContainer, toast, Bounce } from "react-toastify";
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGES = 6;

const TYPE_VARIANT_CONFIG = {
  Plywood:          { mode: "variants",  unit: "sqft",  presets: ["6mm","12mm","18mm","19mm","25mm"],                              placeholder: "e.g. 18mm"      },
  Wood:             { mode: "basePrice", unit: "sqft",  presets: [],                                                               placeholder: "Price per sqft"  },
  Handle:           { mode: "variants",  unit: "piece", presets: ["3 inch","4 inch","6 inch","8 inch","10 inch","12 inch"],         placeholder: "e.g. 4 inch"    },
  Glass:            { mode: "variants",  unit: "sqft",  presets: ["Pel Dhar","Clear","Frosted","Tinted","Reflective","Tempered"],   placeholder: "e.g. Pel Dhar"  },
  Laminate:         { mode: "basePrice", unit: "sheet", presets: [],                                                               placeholder: "Price per sheet" },
  UPVC:             { mode: "basePrice", unit: "piece", presets: [],                                                               placeholder: "Price"           },
  Hardware:         { mode: "basePrice", unit: "piece", presets: [],                                                               placeholder: "Price"           },
  AluminiumSection: { mode: "variants",  unit: "piece", presets: ["1 inch","1.5 inch","2 inch","3 inch"],                          placeholder: "e.g. 2 inch"    },
  Lock:             { mode: "basePrice", unit: "piece", presets: [],                                                               placeholder: "Price"           },
  Hinges:           { mode: "variants",  unit: "piece", presets: ["2 inch","3 inch","4 inch","5 inch"],                            placeholder: "e.g. 3 inch"    },
};

const TYPE_LABELS = {
  Plywood: "Plywood", Wood: "Wood", Handle: "Handle", Glass: "Glass",
  Laminate: "Laminate", UPVC: "UPVC", Hardware: "Hardware",
  AluminiumSection: "Aluminium Section", Lock: "Lock", Hinges: "Hinges",
};

const PRODUCT_TYPES = Object.keys(TYPE_VARIANT_CONFIG);

const TAG_OPTIONS = [
  { value: "best_seller", label: "Best Seller" },
  { value: "featured",    label: "Featured"    },
  { value: "new_arrival", label: "New Arrival" },
];

const TAG_COLORS = {
  best_seller: { active: "bg-amber-50 text-amber-700 border-amber-300",  idle: "text-gray-500 border-gray-200 hover:border-amber-300" },
  featured:    { active: "bg-blue-50  text-blue-700  border-blue-300",   idle: "text-gray-500 border-gray-200 hover:border-blue-300"  },
  new_arrival: { active: "bg-green-50 text-green-700 border-green-300",  idle: "text-gray-500 border-gray-200 hover:border-green-300" },
};

const EMPTY_FORM = {
  name: "", price: "", priceUnit: "", type: "",
  description: "", images: [], variants: [], tags: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddProduct() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const typeConfig    = TYPE_VARIANT_CONFIG[form.type] || null;
  const isVariantMode = typeConfig?.mode === "variants";

  // ─── Type change ────────────────────────────────────────────────────────────
  const handleTypeChange = (e) => {
    const type   = e.target.value;
    const config = TYPE_VARIANT_CONFIG[type] || null;
    setForm((prev) => ({
      ...prev, type,
      variants: [], price: "",
      priceUnit: config?.unit || "",
    }));
  };

  // ─── Tags ───────────────────────────────────────────────────────────────────
  const toggleTag = (tag) =>
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));

  // ─── Variants ───────────────────────────────────────────────────────────────
  const addVariant = (presetLabel = "") =>
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { label: presetLabel, price: "", unit: typeConfig?.unit || "" }],
    }));

  const addPreset = (label) => {
    if (!form.variants.some((v) => v.label === label)) addVariant(label);
  };

  const updateVariant = (i, field, value) =>
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[i] = { ...variants[i], [field]: value };
      return { ...prev, variants };
    });

  const removeVariant = (i) =>
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));

  // ─── Images ─────────────────────────────────────────────────────────────────
  // ✅ FIX: Use onSuccess (not onUpload) — onSuccess fires ONLY on a successful
  //         upload and always contains the upload info with secure_url.
  //         onUpload fires on every widget event (open, queued, etc.) and its
  //         shape varies; it was swallowing the image data silently.
  const handleUploadSuccess = (result) => {
    // next-cloudinary onSuccess: result = { event: "success", info: { secure_url, public_id, … } }
    // Defensive: also handle the case where result IS the info object directly.
    const info = result?.info ?? result;
    if (!info || typeof info === "string") return;

    const url       = info.secure_url;
    const public_id = info.public_id || "";
    if (!url) return;

    setForm((prev) => {
      if (prev.images.length >= MAX_IMAGES) {
        toast.error(`Maximum ${MAX_IMAGES} images allowed.`);
        return prev;
      }
      return {
        ...prev,
        images: [...prev.images, { url, public_id }],
      };
    });
  };

  const removeImage = (i) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));

  const makeCover = (i) =>
    setForm((prev) => {
      const imgs = [...prev.images];
      const [picked] = imgs.splice(i, 1);
      return { ...prev, images: [picked, ...imgs] };
    });

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.type)              { toast.error("Please select a product type.");            return; }
    if (form.images.length === 0){ toast.error("Please upload at least one image.");        return; }

    const payload = { ...form };

    if (isVariantMode) {
      delete payload.price;
      delete payload.priceUnit;
      if (payload.variants.length === 0) { toast.error("Add at least one size/variant with a price."); return; }
      for (const v of payload.variants) {
        if (!v.label || !v.price) { toast.error("Each variant needs a label and price."); return; }
        v.price = parseFloat(v.price);
      }
    } else {
      delete payload.variants;
      if (!payload.price) { toast.error("Please enter a price."); return; }
      payload.price = parseFloat(payload.price);
    }

    setSubmitting(true);
    try {
      const res  = await fetch("/api/product/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Product added successfully.");
        setForm(EMPTY_FORM);
      } else {
        toast.error(data.message || "Something went wrong.");
      }
    } catch {
      toast.error("Request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Auth guard ──────────────────────────────────────────────────────────────
  if (status === "loading") return <p className="p-10 text-sm text-gray-500">Loading…</p>;
  if (!session || !isAdmin)  return notFound();

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer position="top-center" autoClose={4000} theme="light" transition={Bounce} />

      <div className="p-6 max-w-2xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Add Product</h1>
          <p className="text-sm text-gray-400 mt-0.5">Fill in the details below to list a new product.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* ── Name ── */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Product Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Premium Laminate Sheet"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* ── Type ── */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category *</label>
            <select
              value={form.type}
              onChange={handleTypeChange}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select a category</option>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
              ))}
            </select>
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional product description…"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* ── Base price ── */}
          {typeConfig && !isVariantMode && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Price (per {typeConfig.unit}) *
              </label>
              <div className="flex gap-2">
                <input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder={typeConfig.placeholder}
                  type="number" min="0"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                  / {typeConfig.unit}
                </span>
              </div>
            </div>
          )}

          {/* ── Variants ── */}
          {typeConfig && isVariantMode && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Sizes / Options *
              </label>

              {/* Preset chips */}
              {typeConfig.presets.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {typeConfig.presets.map((preset) => {
                    const isAdded = form.variants.some((v) => v.label === preset);
                    return (
                      <button
                        key={preset} type="button"
                        onClick={() => addPreset(preset)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                          isAdded
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                        }`}
                      >
                        {isAdded ? "✓ " : "+ "}{preset}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Column headers */}
              {form.variants.length > 0 && (
                <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                  {["Label", "Price (₹)", "Unit", ""].map((h, i) => (
                    <p key={i} className={`text-xs text-gray-400 font-medium ${i === 3 ? "col-span-1" : "col-span-4"}`}>{h}</p>
                  ))}
                </div>
              )}

              {/* Variant rows */}
              <div className="flex flex-col gap-2">
                {form.variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <input
                      value={v.label}
                      onChange={(e) => updateVariant(i, "label", e.target.value)}
                      placeholder={typeConfig.placeholder}
                      className="col-span-4 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={v.price}
                      onChange={(e) => updateVariant(i, "price", e.target.value)}
                      placeholder="0"
                      type="number" min="0"
                      className="col-span-4 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="col-span-3 text-xs text-gray-400 px-1">
                      / {v.unit || typeConfig.unit}
                    </span>
                    <button
                      type="button" onClick={() => removeVariant(i)}
                      className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-600 transition text-base"
                      aria-label="Remove variant"
                    >✕</button>
                  </div>
                ))}
              </div>

              <button
                type="button" onClick={() => addVariant()}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                + Add custom option
              </button>
            </div>
          )}

          {/* ── Tags ── */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Tags</label>
            <div className="flex gap-2 flex-wrap">
              {TAG_OPTIONS.map(({ value, label }) => {
                const active = form.tags.includes(value);
                const colors = TAG_COLORS[value];
                return (
                  <button
                    key={value} type="button" onClick={() => toggleTag(value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      active ? colors.active : `bg-white ${colors.idle}`
                    }`}
                  >
                    {active ? "✓ " : ""}{label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Image gallery upload ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Product Images *
                </label>
                <p className="text-xs text-gray-400 mt-0.5">
                  Up to {MAX_IMAGES} images. First image is the cover.
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {form.images.length} / {MAX_IMAGES}
              </span>
            </div>

            {/* Uploaded thumbnails */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {form.images.map((img, i) => (
                  <div
                    key={img.public_id || i}
                    className={`relative rounded-xl border-2 overflow-hidden group aspect-square bg-gray-50 ${
                      i === 0 ? "border-blue-400" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Product image ${i + 1}`}
                      className="w-full h-full object-contain p-1"
                    />

                    {/* Cover badge */}
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                        Cover
                      </span>
                    )}

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => makeCover(i)}
                          className="bg-white text-blue-600 text-[10px] font-medium px-2 py-1 rounded-full hover:bg-blue-50 transition"
                        >
                          Make Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="bg-white text-red-500 text-[10px] font-medium px-2 py-1 rounded-full hover:bg-red-50 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload trigger — hidden when limit reached */}
            {form.images.length < MAX_IMAGES && (
              // ✅ FIX: onSuccess instead of onUpload — fires only on successful upload
              <CldUploadButton
                uploadPreset="bxbblrlt"
                onSuccess={handleUploadSuccess}
                className="w-full"
              >
                <div className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                  <div className="text-2xl text-gray-300 group-hover:text-blue-400 transition mb-1">+</div>
                  <p className="text-xs font-medium text-gray-400 group-hover:text-blue-500 transition">
                    {form.images.length === 0 ? "Click to upload images" : "Add another image"}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-0.5">or drag & drop</p>
                </div>
              </CldUploadButton>
            )}
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving…" : "Save Product"}
          </button>

        </form>
      </div>
    </>
  );
}