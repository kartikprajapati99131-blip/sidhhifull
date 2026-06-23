// components/pricelist/SubCategorySection.jsx
"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import ConfirmDelete from "./ConfirmDelete";
import ProductTable from "./ProductTable";
import AddEditModal from "./AddEditModal";

const SUBCAT_FIELDS = [
  { name: "name", label: "Sub-Category Name", required: true, placeholder: "e.g. Roofing Sheets" },
];

/**
 * Props
 * ─────
 * companyId     : string
 * subCategories : Array
 * searchQuery   : string
 * onRefresh     : () => void
 * onToast       : (msg, type) => void
 */
export default function SubCategorySection({
  companyId,
  subCategories = [],
  searchQuery = "",
  onRefresh,
  onToast,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editSubCat, setEditSubCat] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const handleSubmit = async ({ name }) => {
    setLoadingModal(true);
    try {
      const isEdit = !!editSubCat;
      const url = isEdit
        ? `/api/pricelist/subcategory/${editSubCat._id}`
        : `/api/pricelist/subcategory`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, name }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      onToast(data.message, "success");
      setModalOpen(false);
      setEditSubCat(null);
      onRefresh();
    } catch (err) {
      onToast(err.message || "Something went wrong.", "error");
    } finally {
      setLoadingModal(false);
    }
  };

  const handleDelete = async (subCatId) => {
    try {
      const res = await fetch(`/api/pricelist/subcategory/${subCatId}?companyId=${companyId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onToast(data.message, "success");
      onRefresh();
    } catch (err) {
      onToast(err.message || "Delete failed.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => { setEditSubCat(null); setModalOpen(true); }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800"
      >
        <Plus size={13} /> Add sub-category
      </button>

      {subCategories.length === 0 && (
        <p className="text-sm text-slate-400">No sub-categories yet.</p>
      )}

      {/* No separate expand/collapse here on purpose — once the company is
          open, every sub-category's products show right away. */}
      {subCategories.map((subCat) => (
        <div key={subCat._id}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-slate-700">{subCat.name}</span>
            <span className="text-xs text-slate-400">
              {subCat.products?.length ?? 0}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => { setEditSubCat(subCat); setModalOpen(true); }}
                title="Edit sub-category"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
              >
                <Pencil size={13} />
              </button>
              <ConfirmDelete onConfirm={() => handleDelete(subCat._id)} />
            </div>
          </div>

          <ProductTable
            companyId={companyId}
            subCategoryId={subCat._id}
            products={subCat.products}
            searchQuery={searchQuery}
            onRefresh={onRefresh}
            onToast={onToast}
          />
        </div>
      ))}

      <AddEditModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditSubCat(null); }}
        onSubmit={handleSubmit}
        title={editSubCat ? "Edit Sub-Category" : "Add Sub-Category"}
        fields={SUBCAT_FIELDS}
        initialData={editSubCat || {}}
        isLoading={loadingModal}
      />
    </div>
  );
}