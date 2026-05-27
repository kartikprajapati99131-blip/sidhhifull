"use client";

import { useEffect, useState } from "react";
import { CldUploadButton } from "next-cloudinary";
import { ToastContainer, toast, Bounce } from "react-toastify";
import { useSession } from "next-auth/react";

const TYPES = [
  "Laminate", "Plywood", "Glass", "UPVC", "Hardware",
  "AluminiumSection", "Lock", "Handle", "Hinges", "Wood",
];

const UNITS = ["sqft", "sheet", "piece", "meter", "kg", "box", "set"];

const TAG_LABELS = {
  best_seller: "Best Seller",
  featured: "Featured",
  new_arrival: "New Arrival",
};

const TAG_COLORS = {
  best_seller: "bg-amber-50 text-amber-700 border-amber-200",
  featured:    "bg-blue-50 text-blue-700 border-blue-200",
  new_arrival: "bg-green-50 text-green-700 border-green-200",
};

const EMPTY_VARIANT = { label: "", price: "", unit: "", stock: 0 };

// ✅ FIX: EMPTY_FORM now uses `images: []` (array) not `image: null` (legacy)
const EMPTY_FORM = {
  name: "",
  price: "",
  priceUnit: "",
  type: "",
  description: "",
  variants: [],
  tags: [],
  images: [],  // ← was `image: null`
};

const MAX_IMAGES = 6;

export default function ProductsPage() {
  const { data: session } = useSession();

  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [products, setProducts]   = useState([]);
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading]     = useState(false);
  const [updating, setUpdating]   = useState(false);

  useEffect(() => { fetchProducts(); }, [filterType]);

  /* ─── API helpers ─────────────────────────────── */

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/type?type=" + filterType);
      const data = await res.json();
      setProducts(data);
    } catch {
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.name || !form.type) {
      toast.error("Name and category are required.");
      return;
    }
    const hasBasePrice = form.price !== "" && form.price !== null;
    const hasVariants  = form.variants.length > 0;
    if (!hasBasePrice && !hasVariants) {
      toast.error("Add a base price or at least one variant.");
      return;
    }
    const badVariant = form.variants.find((v) => !v.label || v.price === "");
    if (badVariant) {
      toast.error("Each variant needs a label and price.");
      return;
    }

    setUpdating(true);
    try {
      // ✅ FIX: payload uses `images` array, not the legacy `image` field.
      // We omit `image` entirely so the old field is never sent, preventing
      // it from overwriting the `images` array in MongoDB.
      const { image, ...formWithoutLegacy } = form; // strip legacy field if present
      const payload = {
        ...formWithoutLegacy,
        price:    form.price === "" ? undefined : Number(form.price),
        variants: form.variants.map((v) => ({
          ...v,
          price: Number(v.price),
          stock: Number(v.stock) || 0,
        })),
      };

      const res  = await fetch("/api/product/update", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: editItem._id, data: payload }),
      });
      const data = await res.json();
      if (!data.success) { toast.error("Update failed."); return; }
      toast.success("Product updated.");
      setProducts((prev) =>
        prev.map((item) => (item._id === editItem._id ? data.product : item))
      );
      setEditItem(null);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = (id) => {
    confirmDelete(async () => {
      try {
        const res  = await fetch("/api/product/delete", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ id }),
        });
        const data = await res.json();
        if (!data.success) { toast.error("Delete failed."); return; }
        setProducts((prev) => prev.filter((item) => item._id !== id));
        toast.success("Product deleted.");
      } catch {
        toast.error("Something went wrong.");
      }
    });
  };

  // ✅ FIX: handleUpload appends to `images` array instead of setting `image`
  const handleUpload = (result) => {
    if (result.info && typeof result.info !== "string") {
      setForm((prev) => {
        if (prev.images.length >= MAX_IMAGES) {
          toast.error(`Maximum ${MAX_IMAGES} images allowed.`);
          return prev;
        }
        return {
          ...prev,
          images: [
            ...prev.images,
            { url: result.info.secure_url, public_id: result.info.public_id },
          ],
        };
      });
    }
  };

  const removeImage = (i) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));

  const makeCover = (i) =>
    setForm((prev) => {
      const imgs = [...prev.images];
      const [picked] = imgs.splice(i, 1);
      return { ...prev, images: [picked, ...imgs] };
    });

  /* ─── Variant helpers ─────────────────────────── */

  const addVariant = () =>
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { ...EMPTY_VARIANT }] }));

  const removeVariant = (i) =>
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));

  const updateVariant = (i, field, value) =>
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[i] = { ...variants[i], [field]: value };
      return { ...prev, variants };
    });

  /* ─── Tag helpers ─────────────────────────────── */

  const toggleTag = (tag) =>
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));

  /* ─── Edit open/close ─────────────────────────── */

  const openEdit = (p) => {
    setEditItem(p);
    // ✅ FIX: openEdit now maps `p.images` (array) with fallback to legacy
    // `p.image` so old single-image products still show their image in the editor.
    let images = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
      images = p.images.map((img) =>
        typeof img === "string"
          ? { url: img, public_id: "" }
          : { url: img.url, public_id: img.public_id || "" }
      );
    } else if (p.image?.url) {
      images = [{ url: p.image.url, public_id: p.image.public_id || "" }];
    }

    setForm({
      name:        p.name        ?? "",
      price:       p.price       ?? "",
      priceUnit:   p.priceUnit   ?? "",
      type:        p.type        ?? "",
      description: p.description ?? "",
      variants:    (p.variants   ?? []).map((v) => ({ ...v })),
      tags:        p.tags        ?? [],
      images,      // ✅ always an array of {url, public_id}
    });
    setTimeout(() => {
      document.getElementById("edit-panel")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const cancelEdit = () => setEditItem(null);

  /* ─── Toast confirm ───────────────────────────── */

  const confirmDelete = (onConfirm) => {
    toast(
      ({ closeToast }) => (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-sm">Delete this product?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <button onClick={closeToast} className="px-3 py-1.5 rounded text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={() => { onConfirm(); closeToast(); }} className="px-3 py-1.5 rounded text-sm bg-red-500 text-white hover:bg-red-600">
              Delete
            </button>
          </div>
        </div>
      ),
      { position: "top-center", autoClose: false, closeOnClick: false }
    );
  };

  /* ─── Render ──────────────────────────────────── */

  return (
    <>
      <ToastContainer
        position="top-right" autoClose={4000} hideProgressBar={false}
        newestOnTop closeOnClick={false} rtl={false}
        pauseOnFocusLoss draggable pauseOnHover theme="light" transition={Bounce}
      />

      <div className="p-6 w-full max-w-5xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Products</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {loading ? "Loading…" : `${products.length} item${products.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 pr-8 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Categories</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* ── Edit panel ── */}
        {editItem && (
          <div id="edit-panel" className="mb-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <p className="font-semibold text-gray-800 text-sm">Edit Product</p>
                <p className="text-xs text-gray-400 mt-0.5">Updating: {editItem.name}</p>
              </div>
              <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label="Close">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-6">

              {/* ── Row 1: core fields ── */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Product Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Premium Laminate Sheet"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select a category</option>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Base price row */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Base Price (₹)</label>
                    <input
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="e.g. 1200"
                      type="number"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                    <select
                      value={form.priceUnit}
                      onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">—</option>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

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
              </div>

              {/* ── Image gallery ── */}
              {/* ✅ FIX: Full multi-image gallery editor (same as addproduct) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Product Images</label>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Up to {MAX_IMAGES} images. First image is the cover.
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {form.images.length} / {MAX_IMAGES}
                  </span>
                </div>

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
                        {i === 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                            Cover
                          </span>
                        )}
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

                {form.images.length < MAX_IMAGES && (
                  <CldUploadButton
                    uploadPreset="bxbblrlt"
                    onSuccess={handleUpload}
                    className="w-full"
                  >
                    <div className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                      <div className="text-2xl text-gray-300 group-hover:text-blue-400 transition mb-1">+</div>
                      <p className="text-xs font-medium text-gray-400 group-hover:text-blue-500 transition">
                        {form.images.length === 0 ? "Click to upload images" : "Add another image"}
                      </p>
                    </div>
                  </CldUploadButton>
                )}
              </div>

              {/* ── Row 2: Variants ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Variants</p>
                    <p className="text-xs text-gray-400">Size / spec options with individual prices (e.g. 18mm, 4 inch)</p>
                  </div>
                  <button
                    onClick={addVariant}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
                  >
                    + Add Variant
                  </button>
                </div>

                {form.variants.length === 0 ? (
                  <div className="text-center py-5 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
                    No variants — base price will be used
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-12 gap-2 px-1">
                      {["Label *", "Price (₹) *", "Unit", "Stock", ""].map((h, i) => (
                        <p key={i} className={`text-xs text-gray-400 font-medium ${i === 4 ? "col-span-1" : i === 3 ? "col-span-2" : "col-span-3"}`}>{h}</p>
                      ))}
                    </div>

                    {form.variants.map((v, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                        <input
                          value={v.label}
                          onChange={(e) => updateVariant(i, "label", e.target.value)}
                          placeholder="e.g. 18mm"
                          className="col-span-3 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                        />
                        <input
                          value={v.price}
                          onChange={(e) => updateVariant(i, "price", e.target.value)}
                          placeholder="0"
                          type="number"
                          className="col-span-3 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                        />
                        <select
                          value={v.unit}
                          onChange={(e) => updateVariant(i, "unit", e.target.value)}
                          className="col-span-3 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">—</option>
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <input
                          value={v.stock}
                          onChange={(e) => updateVariant(i, "stock", e.target.value)}
                          placeholder="0"
                          type="number"
                          className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                        />
                        <button
                          onClick={() => removeVariant(i)}
                          className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-600 transition"
                          aria-label="Remove variant"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Row 3: Tags ── */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(TAG_LABELS).map(([key, label]) => {
                    const active = form.tags.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleTag(key)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                          active
                            ? TAG_COLORS[key]
                            : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {active ? "✓ " : ""}{label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button onClick={cancelEdit} className="px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-100 transition">
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="px-5 py-2 rounded-lg text-sm bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-60 disabled:cursor-not-allowed font-medium"
              >
                {updating ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ── Product list ── */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📦</div>
            <p className="font-medium text-gray-500">No products found</p>
            <p className="text-sm mt-1">Try a different category or add a new product.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {products.map((p) => {
              const hasVariants = p.variants?.length > 0;
              // ✅ FIX: Product list thumbnail uses images[0] with fallback to legacy image
              const thumbUrl = p.images?.[0]?.url ?? p.image?.url ?? null;
              return (
                <div
                  key={p._id}
                  className={`flex items-center justify-between bg-white p-4 rounded-xl border transition-all ${
                    editItem?._id === p._id
                      ? "border-blue-300 ring-2 ring-blue-100"
                      : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }`}
                >
                  {/* Image */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={p.name} className="w-12 h-12 object-contain" />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-gray-800 text-sm">{p.name}</h2>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p.type}</span>
                        {/* Image count badge */}
                        {p.images?.length > 0 && (
                          <span className="text-xs bg-gray-50 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
                            🖼 {p.images.length}
                          </span>
                        )}
                        {(p.tags ?? []).map((tag) => (
                          <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border ${TAG_COLORS[tag]}`}>
                            {TAG_LABELS[tag]}
                          </span>
                        ))}
                      </div>

                      {hasVariants ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.variants.map((v, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                              {v.label} — ₹{v.price}{v.unit ? `/${v.unit}` : ""}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-blue-600 font-medium text-sm mt-0.5">
                          ₹ {p.price}{p.priceUnit ? ` / ${p.priceUnit}` : ""}
                        </p>
                      )}

                      {p.description && (
                        <p className="text-gray-400 text-xs mt-0.5 truncate max-w-xs">{p.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button
                      onClick={() => openEdit(p)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
