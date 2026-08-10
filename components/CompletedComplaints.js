"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  PRODUCTS,
  ASSIGNEES,
  formatDate,
  formatDateTime,
  isToday,
  lastActor,
  Avatar,
  useDebounced,
  Toast,
  StatusBadge,
  StatCard,
  Modal,
  STATUS_ICON,
  STATUS_ACCENT,
  SHARED_KEYFRAMES,
  exportToCsv,
} from "@/components/complaintShared";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isThisMonth(date) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function CompletedComplaints() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounced(searchTerm);
  const [productFilter, setProductFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");

  const [detailEntry, setDetailEntry] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "completed" });
      if (productFilter) params.set("product", productFilter);
      if (assignedToFilter) params.set("assignedTo", assignedToFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/complaints?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
      } else {
        showToast(data.message || "Failed to load completed complaints", "error");
      }
    } catch {
      showToast("Something went wrong while loading completed complaints", "error");
    } finally {
      setLoading(false);
    }
  }, [productFilter, assignedToFilter, debouncedSearch, showToast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const stats = useMemo(
    () => ({
      total: entries.length,
      today: entries.filter((e) => isToday(e.completedAt)).length,
      thisMonth: entries.filter((e) => isThisMonth(e.completedAt)).length,
      last30: entries.filter((e) => Date.now() - new Date(e.completedAt).getTime() <= THIRTY_DAYS_MS).length,
    }),
    [entries]
  );

  const openDetail = useCallback(async (entry) => {
    setDetailEntry(entry);
    setDetailData(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/complaints/${entry._id}`);
      const data = await res.json();
      if (data.success) {
        setDetailData(data.data);
      } else {
        setDetailError(data.message || "Failed to load details");
      }
    } catch {
      setDetailError("Something went wrong while loading details");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = () => {
    setDetailEntry(null);
    setDetailData(null);
    setDetailError("");
  };

  const handleExport = () => {
    exportToCsv(`completed-complaints-${new Date().toISOString().slice(0, 10)}.csv`, entries, [
      { label: "Customer Name", value: (e) => e.customerName },
      { label: "Mobile", value: (e) => e.mobileNumber },
      { label: "Product", value: (e) => e.product },
      { label: "Assigned To", value: (e) => e.assignedTo },
      { label: "Completed At", value: (e) => formatDateTime(e.completedAt) },
      { label: "Completed By", value: (e) => e.completedBy || lastActor(e) },
      { label: "Registered By", value: (e) => e.registeredBy || "—" },
      { label: "Final Remark", value: (e) => e.remark || "" },
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      <style>{SHARED_KEYFRAMES}</style>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast toast={toast} />

        {/* ── Page header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Link
                href="/complaints"
                className="flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-indigo-600"
              >
                ← Back to Active Complaints
              </Link>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Completed Complaints</h1>
            <p className="text-sm text-slate-500">A resolved-jobs archive, kept separate from the working list.</p>
          </div>
          <button
            onClick={handleExport}
            disabled={entries.length === 0}
            className="flex w-fit items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>⬇</span> Export CSV
          </button>
        </div>

        {/* ── Stat dashboard ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Completed" value={stats.total} icon="📦" tone="emerald" />
          <StatCard label="Completed Today" value={stats.today} icon="✅" tone="indigo" />
          <StatCard label="This Month" value={stats.thisMonth} icon="🗓️" tone="slate" />
          <StatCard label="Last 30 Days" value={stats.last30} icon="⏱️" tone="amber" />
        </div>

        {/* ── Completed Table ── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Header row */}
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-800">Completed</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {entries.length} shown
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-56">
              <svg
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or mobile"
                className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-8 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-44"
            >
              <option value="">All Products</option>
              {PRODUCTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-44"
            >
              <option value="">All Assignees</option>
              {ASSIGNEES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Mobile</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Assigned To</th>
                  <th className="px-5 py-3">Completed At</th>
                  <th className="px-5 py-3">Completed By</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-5 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No completed complaints yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr
                      key={entry._id}
                      onClick={() => openDetail(entry)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3 font-medium text-slate-800">{entry.customerName}</td>
                      <td className="px-5 py-3">
                        <a
                          href={`tel:${entry.mobileNumber}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-sky-600 transition hover:text-sky-800 hover:underline"
                        >
                          +91 {entry.mobileNumber}
                        </a>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{entry.product}</td>
                      <td className="px-5 py-3 text-slate-700">{entry.assignedTo}</td>
                      <td className="px-5 py-3 text-slate-700">{formatDateTime(entry.completedAt)}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Avatar name={entry.completedBy || lastActor(entry)} size={6} />
                          {entry.completedBy || lastActor(entry)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={entry.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Detail Modal (full history timeline) ── */}
      {detailEntry &&
        (() => {
          const d = detailData || detailEntry;
          return (
            <Modal
              onClose={closeDetail}
              maxWidth="max-w-md"
              icon={STATUS_ICON[d.status] || "✅"}
              title={d.customerName}
              subtitle={`${d.product} · ${d.assignedTo}`}
              accent={STATUS_ACCENT[d.status] || "emerald"}
            >
              {detailLoading && (
                <div className="mb-3 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              )}
              {detailError && <p className="mb-3 text-sm text-red-500">{detailError}</p>}

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <StatusBadge status={d.status} />
                <a href={`tel:${d.mobileNumber}`} className="text-sm text-sky-600 hover:text-sky-800 hover:underline">
                  +91 {d.mobileNumber}
                </a>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <div className="col-span-2">
                  <p className="text-xs text-slate-400">Address</p>
                  <p className="font-medium text-slate-700">{d.address}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Completed At</p>
                  <p className="font-medium text-slate-700">{formatDateTime(d.completedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Completed By</p>
                  <p className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Avatar name={d.completedBy || lastActor(d)} size={5} />
                    {d.completedBy || lastActor(d)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Registered By</p>
                  <p className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Avatar name={d.registeredBy} size={5} />
                    {d.registeredBy || "—"}
                  </p>
                </div>
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">History</p>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {(d.history || []).length === 0 ? (
                  <p className="text-sm text-slate-400">No history yet.</p>
                ) : (
                  d.history
                    .slice()
                    .reverse()
                    .map((h, i) => (
                      <div key={i} className="rounded-lg border border-slate-100 px-3 py-2 text-xs">
                        <div className="mb-1 flex items-center justify-between">
                          <StatusBadge status={h.status} />
                          <span className="text-slate-400">{formatDateTime(h.at)}</span>
                        </div>
                        {h.remark && <p className="text-slate-600">{h.remark}</p>}
                        {h.followUpDate && <p className="mt-1 text-slate-400">Follow-up set for {formatDate(h.followUpDate)}</p>}
                        <p className="mt-1.5 flex items-center gap-1 text-slate-400">
                          <Avatar name={h.updatedBy} size={4} />
                          Added by <span className="font-medium text-slate-500">{h.updatedBy || "Unknown User"}</span>
                        </p>
                      </div>
                    ))
                )}
              </div>
            </Modal>
          );
        })()}
    </div>
  );
}
