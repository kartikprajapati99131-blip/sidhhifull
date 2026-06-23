// components/pricelist/CompanySection.jsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Pencil, FileDown } from "lucide-react";
import ConfirmDelete from "./ConfirmDelete";
import SubCategorySection from "./SubCategorySection";
import AddEditModal from "./AddEditModal";
import { exportPriceListPdf } from "@/utils/exportPdf";

const COMPANY_FIELDS = [
  { name: "companyName", label: "Company Name", required: true, placeholder: "e.g. Acme Metals Ltd." },
];

/**
 * Props
 * ─────
 * company    : Object  (full company document)
 * searchQuery: string
 * onRefresh  : () => void
 * onToast    : (msg, type) => void
 */
export default function CompanySection({ company, searchQuery = "", onRefresh, onToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const handleEdit = async ({ companyName }) => {
    setLoadingEdit(true);
    try {
      const res = await fetch(`/api/pricelist/company/${company._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onToast(data.message, "success");
      setEditOpen(false);
      onRefresh();
    } catch (err) {
      onToast(err.message || "Update failed.", "error");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/pricelist/company/${company._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onToast(data.message, "success");
      onRefresh();
    } catch (err) {
      onToast(err.message || "Delete failed.", "error");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          {isOpen
            ? <ChevronDown size={16} className="text-slate-400 shrink-0" />
            : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
          <span className="text-sm font-semibold text-slate-800 truncate">
            {company.companyName}
          </span>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => exportPriceListPdf(company)}
            title="Export PDF"
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition"
          >
            <FileDown size={15} />
          </button>
          <button
            onClick={() => setEditOpen(true)}
            title="Edit company"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
          >
            <Pencil size={14} />
          </button>
          <ConfirmDelete onConfirm={handleDelete} />
        </div>
      </div>

      {/* ── Sub-categories (expanded) ─────────────────────────────────────── */}
      {isOpen && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <SubCategorySection
            companyId={company._id}
            subCategories={company.subCategories}
            searchQuery={searchQuery}
            onRefresh={onRefresh}
            onToast={onToast}
          />
        </div>
      )}

      <AddEditModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
        title="Edit Company"
        fields={COMPANY_FIELDS}
        initialData={{ companyName: company.companyName }}
        isLoading={loadingEdit}
      />
    </div>
  );
}