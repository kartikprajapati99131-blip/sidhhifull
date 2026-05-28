"use client";

import { useState, useEffect, useCallback } from "react";
import { CldUploadButton } from "next-cloudinary";
import { ToastContainer, toast, Bounce } from "react-toastify";
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_TYPES = [
  { value: "Plywood",          label: "Plywood"           },
  { value: "Wood",             label: "Wood"              },
  { value: "Handle",           label: "Handle"            },
  { value: "Glass",            label: "Glass"             },
  { value: "Laminate",         label: "Laminate"          },
  { value: "UPVC",             label: "UPVC"              },
  { value: "Hardware",         label: "Hardware"          },
  { value: "AluminiumSection", label: "Aluminium Section" },
  { value: "Lock",             label: "Lock"              },
  { value: "Hinges",           label: "Hinges"            },
];

const EMPTY_FORM = {
  name: "",
  type: "",
  logo: { url: "", public_id: "" },
  subCategories: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ManageBrands() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [brands, setBrands]         = useState([]);
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [newSubCat, setNewSubCat]   = useState("");

  // ─── Fetch brands ────────────────────────────────────────────────────────────
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterType
        ? `/api/brand/list?type=${filterType}`
        : `/api/brand/list`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.success) setBrands(data.brands);
    } catch {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  // ─── Form helpers ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setNewSubCat("");
    setShowForm(false);
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setNewSubCat("");
    setShowForm(true);
  };

  const openEdit = (brand) => {
    setForm({
      name:          brand.name,
      type:          brand.type,
      logo:          brand.logo || { url: "", public_id: "" },
      subCategories: brand.subCategories || [],
    });
    setEditingId(brand._id);
    setNewSubCat("");
    setShowForm(true);
  };

  const handleLogoUpload = (result) => {
    const info = result?.info ?? result;
    if (!info || typeof info === "string") return;
    if (!info.secure_url) return;
    setForm((prev) => ({
      ...prev,
      logo: { url: info.secure_url, public_id: info.public_id || "" },
    }));
  };

  const addSubCat = () => {
    const val = newSubCat.trim();
    if (!val) return;
    if (form.subCategories.includes(val)) {
      toast.error("Sub-category already added");
      return;
    }
    setForm((prev) => ({ ...prev, subCategories: [...prev.subCategories, val] }));
    setNewSubCat("");
  };

  const removeSubCat = (i) =>
    setForm((prev) => ({
      ...prev,
      subCategories: prev.subCategories.filter((_, idx) => idx !== i),
    }));

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Brand name is required");    return; }
    if (!form.type)        { toast.error("Please select a type");      return; }

    setSubmitting(true);
    try {
      const url    = editingId ? `/api/brand/${editingId}` : "/api/brand/create";
      const method = editingId ? "PUT" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(editingId ? "Brand updated!" : "Brand added!");
        resetForm();
        fetchBrands();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch {
      toast.error("Request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!confirm(`Delete brand "${name}"? This cannot be undone.`)) return;
    try {
      const res  = await fetch(`/api/brand/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Brand deleted");
        fetchBrands();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch {
      toast.error("Delete request failed");
    }
  };

  // ─── Auth guard ───────────────────────────────────────────────────────────────
  if (status === "loading") return <p className="p-10 text-sm text-gray-500">Loading…</p>;
  if (!session || !isAdmin)  return notFound();

  // ─── Type label helper ────────────────────────────────────────────────────────
  const typeLabel = (val) => PRODUCT_TYPES.find((t) => t.value === val)?.label || val;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer position="top-center" autoClose={4000} theme="light" transition={Bounce} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500&display=swap');
        .mb-page { font-family: 'Outfit', sans-serif; padding: 1.5rem; max-width: 860px; margin: 0 auto; color: #1a1814; }
        .mb-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
        .mb-title { font-size: 1.2rem; font-weight: 500; color: #1a1814; }
        .mb-sub   { font-size: 13px; color: #9b9186; margin-top: 2px; }

        .mb-btn-add {
          display: flex; align-items: center; gap: 6px;
          background: #1a1814; color: #faf8f5; border: none;
          border-radius: 8px; padding: 0.55rem 1rem;
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: background 0.2s;
        }
        .mb-btn-add:hover { background: #2e2a24; }

        .mb-filter {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1.4rem;
        }
        .mb-filter-btn {
          padding: 5px 14px; border-radius: 100px; font-size: 12px; font-weight: 500;
          border: 1px solid #e4ddd3; background: #faf8f5; color: #7a6a5a;
          cursor: pointer; transition: all 0.15s; font-family: 'Outfit', sans-serif;
        }
        .mb-filter-btn:hover  { border-color: #b8956a; color: #b8956a; }
        .mb-filter-btn.active { background: #1a1814; color: #faf8f5; border-color: #1a1814; }

        /* Form modal overlay */
        .mb-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .mb-modal {
          background: #fff; border-radius: 14px; width: 100%; max-width: 520px;
          max-height: 90vh; overflow-y: auto;
          border: 1px solid #ede9e2; position: relative;
        }
        .mb-modal-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid #ede9e2;
        }
        .mb-modal-title { font-size: 15px; font-weight: 500; color: #1a1814; }
        .mb-modal-close {
          width: 28px; height: 28px; border-radius: 50%; border: 1px solid #e4ddd3;
          background: #faf8f5; display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 14px; color: #9b9186; transition: all 0.15s;
        }
        .mb-modal-close:hover { background: #f0ebe4; color: #1a1814; }
        .mb-modal-body { padding: 1.4rem 1.5rem; display: flex; flex-direction: column; gap: 1.1rem; }

        .mb-label {
          display: block; font-size: 10.5px; letter-spacing: 0.12em;
          text-transform: uppercase; color: #9b9186; font-weight: 500; margin-bottom: 6px;
        }
        .mb-input {
          width: 100%; background: #faf8f5; border: 1px solid #e4ddd3; border-radius: 8px;
          padding: 0.65rem 0.9rem; font-size: 14px; font-family: 'Outfit', sans-serif;
          color: #1a1814; outline: none; box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .mb-input:focus { border-color: #b8956a; box-shadow: 0 0 0 3px rgba(184,149,106,0.12); }
        .mb-select {
          width: 100%; background: #faf8f5; border: 1px solid #e4ddd3; border-radius: 8px;
          padding: 0.65rem 0.9rem; font-size: 14px; font-family: 'Outfit', sans-serif;
          color: #1a1814; outline: none; box-sizing: border-box; cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .mb-select:focus { border-color: #b8956a; box-shadow: 0 0 0 3px rgba(184,149,106,0.12); }

        /* Logo upload */
        .mb-logo-row { display: flex; align-items: center; gap: 12px; }
        .mb-logo-preview {
          width: 64px; height: 64px; border-radius: 10px; border: 1px solid #e4ddd3;
          background: #faf8f5; display: flex; align-items: center; justify-content: center;
          overflow: hidden; flex-shrink: 0;
        }
        .mb-logo-preview img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
        .mb-logo-placeholder { font-size: 22px; color: #d0c9c0; }
        .mb-upload-btn {
          flex: 1; border: 1.5px dashed #e4ddd3; border-radius: 8px;
          padding: 0.65rem 1rem; font-size: 13px; color: #9b9186;
          background: #faf8f5; cursor: pointer; text-align: center;
          transition: border-color 0.15s, color 0.15s;
        }
        .mb-upload-btn:hover { border-color: #b8956a; color: #b8956a; }

        /* Sub-categories */
        .mb-subcat-input-row { display: flex; gap: 8px; }
        .mb-subcat-input-row .mb-input { flex: 1; }
        .mb-btn-sm {
          padding: 0.45rem 0.9rem; border-radius: 7px; font-size: 12.5px; font-weight: 500;
          font-family: 'Outfit', sans-serif; cursor: pointer; border: 1px solid #e4ddd3;
          background: #faf8f5; color: #5a5248; transition: all 0.15s; white-space: nowrap;
        }
        .mb-btn-sm:hover { border-color: #b8956a; color: #b8956a; }
        .mb-subcats { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 8px; }
        .mb-subcat-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: #f5f0ea; border: 1px solid #e4ddd3; border-radius: 100px;
          font-size: 12px; color: #5a5248; padding: 3px 10px 3px 12px;
        }
        .mb-subcat-remove {
          width: 16px; height: 16px; border-radius: 50%; background: #e4ddd3;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; cursor: pointer; color: #7a6a5a;
          transition: background 0.15s; flex-shrink: 0;
        }
        .mb-subcat-remove:hover { background: #e57373; color: #fff; }

        /* Submit button in modal */
        .mb-btn-submit {
          width: 100%; padding: 0.75rem; background: #1a1814; color: #faf8f5;
          border: none; border-radius: 8px; font-family: 'Outfit', sans-serif;
          font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s, opacity 0.2s;
          margin-top: 0.3rem;
        }
        .mb-btn-submit:hover    { background: #2e2a24; }
        .mb-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Brand grid */
        .mb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
        .mb-card {
          background: #fff; border: 1px solid #ede9e2; border-radius: 12px;
          padding: 1rem; display: flex; flex-direction: column; gap: 10px;
          transition: box-shadow 0.15s;
        }
        .mb-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .mb-card-top { display: flex; align-items: center; gap: 10px; }
        .mb-card-logo {
          width: 48px; height: 48px; border-radius: 8px; border: 1px solid #e4ddd3;
          background: #faf8f5; overflow: hidden; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .mb-card-logo img { width: 100%; height: 100%; object-fit: contain; padding: 3px; }
        .mb-card-logo-empty { font-size: 18px; color: #d0c9c0; }
        .mb-card-info { flex: 1; min-width: 0; }
        .mb-card-name { font-size: 14px; font-weight: 500; color: #1a1814; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mb-card-type {
          display: inline-block; margin-top: 3px; font-size: 10px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          background: #f5f0ea; color: #7a5c30; border-radius: 100px; padding: 2px 8px;
        }
        .mb-card-subcats { display: flex; flex-wrap: wrap; gap: 5px; }
        .mb-card-subcat-pill {
          font-size: 11px; background: #f5f5f5; border: 1px solid #e8e8e8;
          border-radius: 100px; padding: 2px 9px; color: #666;
        }
        .mb-card-actions { display: flex; gap: 7px; }
        .mb-card-btn {
          flex: 1; padding: 5px 0; border-radius: 7px; font-size: 12px; font-weight: 500;
          font-family: 'Outfit', sans-serif; cursor: pointer; border: 1px solid #e4ddd3;
          background: #faf8f5; color: #5a5248; transition: all 0.15s; text-align: center;
        }
        .mb-card-btn:hover       { border-color: #b8956a; color: #b8956a; }
        .mb-card-btn.danger:hover { border-color: #e57373; color: #e57373; }

        .mb-empty { text-align: center; padding: 3rem 1rem; color: #c4bbb0; font-size: 14px; }
        .mb-loading { text-align: center; padding: 3rem 1rem; color: #c4bbb0; font-size: 13px; }

        .spin { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(250,248,245,0.25); border-top-color: #faf8f5; border-radius: 50%; animation: sp 0.7s linear infinite; }
        @keyframes sp { to { transform: rotate(360deg); } }
      `}</style>

      <div className="mb-page">

        {/* Header */}
        <div className="mb-header">
          <div>
            <p className="mb-title">Manage Brands</p>
            <p className="mb-sub">Add logos and sub-categories for each product type.</p>
          </div>
          <button className="mb-btn-add" onClick={openAdd}>
            + Add Brand
          </button>
        </div>

        {/* Filter by type */}
        <div className="mb-filter">
          <button
            className={`mb-filter-btn${filterType === "" ? " active" : ""}`}
            onClick={() => setFilterType("")}
          >
            All
          </button>
          {PRODUCT_TYPES.map((t) => (
            <button
              key={t.value}
              className={`mb-filter-btn${filterType === t.value ? " active" : ""}`}
              onClick={() => setFilterType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Brand grid */}
        {loading ? (
          <p className="mb-loading">Loading brands…</p>
        ) : brands.length === 0 ? (
          <div className="mb-empty">
            <p style={{ fontSize: 32, marginBottom: 8 }}>🏷️</p>
            <p>No brands yet{filterType ? ` for ${typeLabel(filterType)}` : ""}.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Click "Add Brand" to get started.</p>
          </div>
        ) : (
          <div className="mb-grid">
            {brands.map((brand) => (
              <div key={brand._id} className="mb-card">
                <div className="mb-card-top">
                  <div className="mb-card-logo">
                    {brand.logo?.url
                      ? <img src={brand.logo.url} alt={brand.name} />
                      : <span className="mb-card-logo-empty">🏷️</span>
                    }
                  </div>
                  <div className="mb-card-info">
                    <p className="mb-card-name">{brand.name}</p>
                    <span className="mb-card-type">{typeLabel(brand.type)}</span>
                  </div>
                </div>

                {brand.subCategories?.length > 0 && (
                  <div className="mb-card-subcats">
                    {brand.subCategories.map((s, i) => (
                      <span key={i} className="mb-card-subcat-pill">{s}</span>
                    ))}
                  </div>
                )}

                <div className="mb-card-actions">
                  <button className="mb-card-btn"       onClick={() => openEdit(brand)}>Edit</button>
                  <button className="mb-card-btn danger" onClick={() => handleDelete(brand._id, brand.name)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="mb-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
          <div className="mb-modal">
            <div className="mb-modal-head">
              <p className="mb-modal-title">{editingId ? "Edit Brand" : "Add Brand"}</p>
              <button className="mb-modal-close" onClick={resetForm}>✕</button>
            </div>

            <div className="mb-modal-body">

              {/* Name */}
              <div>
                <label className="mb-label">Brand Name *</label>
                <input
                  className="mb-input"
                  placeholder="e.g. Sitos, Greenply, Saint-Gobain"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Type */}
              <div>
                <label className="mb-label">Product Type *</label>
                <select
                  className="mb-select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="">Select a type</option>
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Logo */}
              <div>
                <label className="mb-label">Brand Logo</label>
                <div className="mb-logo-row">
                  <div className="mb-logo-preview">
                    {form.logo?.url
                      ? <img src={form.logo.url} alt="Logo preview" />
                      : <span className="mb-logo-placeholder">🏷️</span>
                    }
                  </div>
                  <CldUploadButton
                    uploadPreset="bxbblrlt"
                    onSuccess={handleLogoUpload}
                    style={{ flex: 1, display: "block" }}
                  >
                    <div className="mb-upload-btn">
                      {form.logo?.url ? "Change logo" : "Upload logo"} →
                    </div>
                  </CldUploadButton>
                </div>
              </div>

              {/* Sub-categories */}
              <div>
                <label className="mb-label">Sub-categories <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 300, color: "#c4bbb0" }}>(optional)</span></label>
                <div className="mb-subcat-input-row">
                  <input
                    className="mb-input"
                    placeholder="e.g. Glossy, Matte, Wooden"
                    value={newSubCat}
                    onChange={(e) => setNewSubCat(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubCat(); } }}
                  />
                  <button className="mb-btn-sm" onClick={addSubCat} type="button">Add</button>
                </div>
                {form.subCategories.length > 0 && (
                  <div className="mb-subcats">
                    {form.subCategories.map((s, i) => (
                      <span key={i} className="mb-subcat-tag">
                        {s}
                        <span className="mb-subcat-remove" onClick={() => removeSubCat(i)}>✕</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="mb-btn-submit"
                onClick={handleSubmit}
                disabled={submitting}
                type="button"
              >
                {submitting
                  ? <><span className="spin" style={{ marginRight: 8 }} />{editingId ? "Updating…" : "Saving…"}</>
                  : editingId ? "Update Brand" : "Save Brand"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}