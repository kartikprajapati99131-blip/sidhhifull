// components/pricelist/PriceListManager.jsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import CompanySection from "./CompanySection";
import AddEditModal from "./AddEditModal";

const COMPANY_FIELDS = [
  { name: "companyName", label: "Company Name", required: true, placeholder: "e.g. Acme Metals Ltd." },
];

// ── Toast ────────────────────────────────────────────────────────────────
function Toast({ toasts, onDismiss }) {
  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`flex items-center gap-2.5 pl-4 pr-2 py-3 rounded-xl shadow-lg text-sm font-medium
            text-white pointer-events-auto
            ${t.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}
        >
          {t.type === "error"
            ? <AlertCircle size={16} className="shrink-0" />
            : <CheckCircle size={16} className="shrink-0" />}
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="ml-1 p-1 rounded-lg hover:bg-white/20 transition shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────
export default function PriceListManager() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastTimer = useRef({});
  const searchInputRef = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(toastTimer.current[id]);
    delete toastTimer.current[id];
  }, []);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    toastTimer.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete toastTimer.current[id];
    }, 3500);
  }, []);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/pricelist/company");
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setCompanies(data.data);
    } catch (err) {
      setLoadError(err.message || "Couldn't load your price lists.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    return () => Object.values(toastTimer.current).forEach(clearTimeout);
  }, [fetchCompanies]);

  const handleAddCompany = async ({ companyName }) => {
    setLoadingModal(true);
    try {
      const res = await fetch("/api/pricelist/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast(data.message || `${companyName} added.`, "success");
      setModalOpen(false);
      fetchCompanies();
    } catch (err) {
      showToast(err.message || "Couldn't add that company.", "error");
    } finally {
      setLoadingModal(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter((c) => {
      if (c.companyName.toLowerCase().includes(q)) return true;
      return c.subCategories?.some(
        (sc) =>
          sc.name.toLowerCase().includes(q) ||
          sc.products?.some(
            (p) =>
              p.productName.toLowerCase().includes(q) ||
              p.code.toLowerCase().includes(q) ||
              p.thickness?.toLowerCase().includes(q)
          )
      );
    });
  }, [companies, searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-blue-700 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white tracking-tight">Price List Manager</h1>
          <p className="text-blue-200 text-sm mt-1">Manage companies, sub-categories and products</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && searchQuery && clearSearch()}
              placeholder="Search companies, products, codes…"
              aria-label="Search"
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-300 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm
                       font-semibold text-white bg-blue-700 rounded-xl hover:bg-blue-800
                       transition shadow-sm whitespace-nowrap"
          >
            <Plus size={16} /> Add Company
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-5 pb-16 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-sm">Loading price lists…</span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <p className="text-sm text-slate-500">{loadError}</p>
            <button
              onClick={fetchCompanies}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold
                         text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <p className="text-sm text-slate-400">
              {searchQuery ? "No results match your search." : "No companies yet."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold
                           text-white bg-blue-700 rounded-xl hover:bg-blue-800 transition"
              >
                <Plus size={14} /> Add your first company
              </button>
            )}
          </div>
        ) : (
          filteredCompanies.map((company) => (
            <CompanySection
              key={company._id}
              company={company}
              searchQuery={searchQuery}
              onRefresh={fetchCompanies}
              onToast={showToast}
            />
          ))
        )}
      </div>

      <AddEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddCompany}
        title="Add Company"
        fields={COMPANY_FIELDS}
        isLoading={loadingModal}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}