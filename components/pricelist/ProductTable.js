// components/pricelist/ProductTable.jsx
"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import ConfirmDelete from "./ConfirmDelete";
import AddEditModal from "./AddEditModal";

const PRODUCT_FIELDS = [
  { name: "productName", label: "Product Name", required: true, placeholder: "e.g. Aluminium Sheet" },
  { name: "code",        label: "Code",         required: true, placeholder: "e.g. AL-001" },
  { name: "thickness",   label: "Thickness",    placeholder: "e.g. 2mm" },
  { name: "rate",        label: "Sr. No.",      required: true, placeholder: "e.g. SR-001" },
  { name: "netPrice",    label: "Net Price (₹)", type: "number", required: true, placeholder: "0" },
  { name: "dp",          label: "DP (₹)",       type: "number", required: true, placeholder: "0" },
];

/**
 * Props
 * ─────
 * companyId     : string
 * subCategoryId : string
 * products      : Array
 * searchQuery   : string   (global search string passed from parent)
 * onRefresh     : () => void
 * onToast       : (msg, type) => void
 */
export default function ProductTable({
  companyId,
  subCategoryId,
  products = [],
  searchQuery = "",
  onRefresh,
  onToast,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const filtered = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.productName.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.thickness?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (formData) => {
    setLoadingModal(true);
    try {
      const isEdit = !!editProduct;
      const url = isEdit
        ? `/api/pricelist/product/${editProduct._id}`
        : `/api/pricelist/product`;
      const method = isEdit ? "PUT" : "POST";

      // Form inputs always deliver strings. netPrice/dp are true numeric
      // fields, so coerce them here so the database — and anything that
      // later reads these fields (like PDF export) — gets numbers, not
      // strings, and never silently stores NaN. "rate" is now a free-text
      // Sr. No. field (letters + numbers allowed) and is sent as-is.
      const payload = {
        ...formData,
        netPrice: Number(formData.netPrice),
        dp: Number(formData.dp),
      };

      if ([payload.netPrice, payload.dp].some((n) => !Number.isFinite(n))) {
        throw new Error("Net Price and DP must be valid numbers.");
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, subCategoryId, ...payload }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      onToast(data.message, "success");
      setModalOpen(false);
      setEditProduct(null);
      onRefresh();
    } catch (err) {
      onToast(err.message || "Something went wrong.", "error");
    } finally {
      setLoadingModal(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      const res = await fetch(
        `/api/pricelist/product/${productId}?companyId=${companyId}&subCategoryId=${subCategoryId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onToast(data.message, "success");
      onRefresh();
    } catch (err) {
      onToast(err.message || "Delete failed.", "error");
    }
  };

  const fmt = (n) => Number(n).toLocaleString("en-IN");

  return (
    <div className="mb-2">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => { setEditProduct(null); setModalOpen(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                     text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={13} /> Add Product
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-2 text-center">
          {searchQuery ? "No products match your search." : "No products yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                {["Product", "Code", "Thickness", "Sr. No.", "Net Price", "DP", ""].map((col) => (
                  <th key={col} className="px-3 py-2 text-left whitespace-nowrap font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product) => (
                <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                  {/* uppercase is intentional here per user preference */}
                  <td className="px-3 py-2 font-medium text-slate-800 uppercase">
                    {product.productName}
                  </td>
                  <td className="px-3 py-2 text-slate-600 font-mono uppercase">
                    {product.code}
                  </td>
                  <td className="px-3 py-2 text-slate-500 uppercase">
                    {product.thickness || "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-700 uppercase">{product.rate}</td>
                  <td className="px-3 py-2 text-slate-700 tabular-nums">{fmt(product.netPrice)}</td>
                  <td className="px-3 py-2 text-slate-700 tabular-nums">{fmt(product.dp)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditProduct(product); setModalOpen(true); }}
                        title="Edit product"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <ConfirmDelete onConfirm={() => handleDelete(product._id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddEditModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        onSubmit={handleSubmit}
        title={editProduct ? "Edit Product" : "Add Product"}
        fields={PRODUCT_FIELDS}
        initialData={editProduct || {}}
        isLoading={loadingModal}
      />
    </div>
  );
}