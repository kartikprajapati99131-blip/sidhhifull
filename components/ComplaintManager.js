"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  PRODUCTS,
  ASSIGNEES,
  inputCls,
  formatDate,
  formatDateTime,
  isToday,
  isNonVisiting,
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

// Row actions -> the status they set + a display label/icon/accent for the shared modal.
const ACTIONS = [
  { status: "completed", label: "Complete", icon: "✓", accent: "emerald", cls: "text-emerald-700 hover:bg-emerald-50" },
  { status: "need-visit", label: "Need Visit", icon: "⚑", accent: "amber", cls: "text-amber-700 hover:bg-amber-50" },
  { status: "follow-up", label: "Follow Up", icon: "↻", accent: "violet", cls: "text-violet-700 hover:bg-violet-50" },
  { status: "call-site", label: "Call / Site", icon: "☎", accent: "sky", cls: "text-sky-700 hover:bg-sky-50" },
];

const emptyForm = {
  customerName: "",
  mobileNumber: "",
  address: "",
  product: PRODUCTS[0],
  assignedTo: ASSIGNEES[0],
  followUpDate: "",
  remark: "",
};

export default function ComplaintManager() {
  const { data: session } = useSession();
  // Every write (add / edit / status change) is stamped with this name —
  // pulled straight from the signed-in session, never a free-text field, so
  // the "who did this" trail can be trusted.
  const actorName = session?.user?.name || session?.user?.email || "Unknown User";

  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({
    todayUpdates: [],
    todayDue: [],
    last7DaysPending: [],
    nonVisiting: [],
    activeCount: 0,
    completedCount: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounced(searchTerm);
  const [productFilter, setProductFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");

  const [actionModal, setActionModal] = useState(null); // { entry, status, label }
  const [actionForm, setActionForm] = useState({ remark: "", followUpDate: "" });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  // Actions dropdown — position is computed in viewport (fixed) coordinates
  // from the trigger button's rect, and the menu is rendered outside the
  // scrollable table wrapper. This is what was causing the dropdown to be
  // clipped / unclickable before: an absolutely-positioned menu inside a
  // container with overflow-x-auto gets its overflow-y implicitly clamped
  // to "auto" too, so the menu was being cut off (or eating the click that
  // was meant to reach it) whenever a row was near the bottom of the table.
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  const [detailEntry, setDetailEntry] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [remindersOpen, setRemindersOpen] = useState(false);
  const autoOpenedRef = useRef(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Only ACTIVE (not-yet-completed) complaints live on this page — once a
  // complaint is marked Complete it moves to the dedicated Completed page.
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "active" });
      if (productFilter) params.set("product", productFilter);
      if (assignedToFilter) params.set("assignedTo", assignedToFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/complaints?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
      } else {
        showToast(data.message || "Failed to load complaints", "error");
      }
    } catch {
      showToast("Something went wrong while loading complaints", "error");
    } finally {
      setLoading(false);
    }
  }, [productFilter, assignedToFilter, debouncedSearch, showToast]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/complaints/summary");
      const data = await res.json();
      if (data.success) {
        setSummary((prev) => ({ ...prev, ...data.data }));
        if (!autoOpenedRef.current && (data.data.todayDue.length > 0 || data.data.last7DaysPending.length > 0)) {
          setRemindersOpen(true);
          autoOpenedRef.current = true;
        }
      }
    } catch {
      // non-fatal — bell popup and stat cards just stay at their last value
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Close the actions menu on outside click, Escape, or scroll/resize
  // (since it's now fixed-positioned, it must close rather than drift).
  useEffect(() => {
    if (!openMenuId) return;

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    function handleClose() {
      setOpenMenuId(null);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", (e) => e.key === "Escape" && handleClose());
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [openMenuId]);

  const refreshAll = useCallback(() => {
    fetchEntries();
    fetchSummary();
  }, [fetchEntries, fetchSummary]);

  // ---- Tab filtering (client-side, computed from lastUpdatedAt/followUpDate — no stored flags) ----
  const tabbedEntries = useMemo(() => {
    switch (activeTab) {
      case "due-today":
        return entries.filter((e) => isToday(e.followUpDate));
      case "non-visiting":
        return entries.filter((e) => isNonVisiting(e));
      case "today":
        return entries.filter((e) => isToday(e.lastUpdatedAt));
      default:
        return entries;
    }
  }, [entries, activeTab]);

  const tabCounts = useMemo(
    () => ({
      all: entries.length,
      "due-today": entries.filter((e) => isToday(e.followUpDate)).length,
      "non-visiting": entries.filter((e) => isNonVisiting(e)).length,
      today: entries.filter((e) => isToday(e.lastUpdatedAt)).length,
    }),
    [entries]
  );

  const TABS = [
    { key: "all", label: "All Active" },
    { key: "due-today", label: "Due Today" },
    { key: "non-visiting", label: "Non-Visiting" },
    { key: "today", label: "Today's Updates" },
  ];

  // ---- Add complaint ----
  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.mobileNumber.trim() || !form.address.trim()) {
      showToast("Customer name, mobile number and address are required", "error");
      return;
    }
    if (!/^\d{10}$/.test(form.mobileNumber.trim())) {
      showToast("Mobile number must be exactly 10 digits", "error");
      return;
    }
    if (!form.followUpDate) {
      showToast("Follow-up date is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, actorName }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Complaint registered successfully");
        setForm(emptyForm);
        setFormOpen(false);
        refreshAll();
      } else {
        showToast(data.message || "Failed to register complaint", "error");
      }
    } catch {
      showToast("Something went wrong while registering the complaint", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Actions dropdown ----
  const toggleMenu = (e, entry) => {
    e.stopPropagation();
    if (openMenuId === entry._id) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 192; // w-48
    const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 240; // approx, enough for 4 actions + edit + delete
    const openUpward = spaceBelow < menuHeight && rect.top > menuHeight;
    setMenuPos({
      top: openUpward ? rect.top - menuHeight + 8 : rect.bottom + 6,
      left: Math.max(left, 12),
    });
    setOpenMenuId(entry._id);
  };

  const openActionModal = (entry, action) => {
    setActionModal({ entry, ...action });
    setActionForm({ remark: "", followUpDate: "" });
    setOpenMenuId(null);
  };

  const closeActionModal = () => {
    setActionModal(null);
    setActionForm({ remark: "", followUpDate: "" });
  };

  // ---- Edit ----
  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      customerName: entry.customerName,
      mobileNumber: entry.mobileNumber,
      address: entry.address,
      product: entry.product,
      assignedTo: entry.assignedTo,
      followUpDate: entry.followUpDate ? entry.followUpDate.slice(0, 10) : "",
      remark: "",
    });
    setOpenMenuId(null);
  };

  const closeEditModal = () => {
    setEditingEntry(null);
    setEditForm(emptyForm);
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    if (!editForm.customerName.trim() || !editForm.mobileNumber.trim() || !editForm.address.trim()) {
      showToast("Customer name, mobile number and address are required", "error");
      return;
    }
    if (!/^\d{10}$/.test(editForm.mobileNumber.trim())) {
      showToast("Mobile number must be exactly 10 digits", "error");
      return;
    }
    if (!editForm.followUpDate) {
      showToast("Follow-up date is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${editingEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEdit: true,
          customerName: editForm.customerName,
          mobileNumber: editForm.mobileNumber,
          address: editForm.address,
          product: editForm.product,
          assignedTo: editForm.assignedTo,
          followUpDate: editForm.followUpDate,
          actorName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Complaint updated successfully");
        closeEditModal();
        refreshAll();
        if (detailEntry && detailEntry._id === editingEntry._id) {
          setDetailData(data.data);
        }
      } else {
        showToast(data.message || "Failed to update complaint", "error");
      }
    } catch {
      showToast("Something went wrong while updating the complaint", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal) return;
    if (!actionForm.remark.trim()) {
      showToast("Remark is required", "error");
      return;
    }
    if (actionModal.status === "follow-up" && !actionForm.followUpDate) {
      showToast("Follow-up date is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${actionModal.entry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionModal.status,
          remark: actionForm.remark.trim(),
          followUpDate: actionModal.status === "follow-up" ? actionForm.followUpDate : undefined,
          actorName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          actionModal.status === "completed"
            ? "Marked as completed — moved to the Completed page"
            : "Complaint updated successfully"
        );
        closeActionModal();
        refreshAll();
        if (detailEntry && detailEntry._id === actionModal.entry._id) {
          setDetailData(data.data);
        }
      } else {
        showToast(data.message || "Failed to update complaint", "error");
      }
    } catch {
      showToast("Something went wrong while updating the complaint", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${deleteTarget._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Complaint deleted successfully");
        refreshAll();
      } else {
        showToast(data.message || "Failed to delete complaint", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
    }
  };

  // ---- Detail modal ----
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
    exportToCsv(`active-complaints-${new Date().toISOString().slice(0, 10)}.csv`, tabbedEntries, [
      { label: "Customer Name", value: (e) => e.customerName },
      { label: "Mobile", value: (e) => e.mobileNumber },
      { label: "Product", value: (e) => e.product },
      { label: "Assigned To", value: (e) => e.assignedTo },
      { label: "Status", value: (e) => e.status },
      { label: "Follow-up Date", value: (e) => formatDate(e.followUpDate) },
      { label: "Last Updated By", value: (e) => lastActor(e) },
      { label: "Last Updated At", value: (e) => formatDateTime(e.lastUpdatedAt) },
    ]);
  };

  const reminderCount = summary.todayDue.length + summary.last7DaysPending.length;

  return (
    <div className="min-h-screen bg-slate-50/60">
      <style>{SHARED_KEYFRAMES}</style>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast toast={toast} />

        {/* ── Page header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Complaint Management</h1>
            <p className="text-sm text-slate-500">Track site visits, follow-ups and resolutions in one place.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/complaints/completed"
              className="flex w-fit items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 active:scale-[0.98]"
            >
              <span>✅</span>
              Completed
              <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {summary.completedCount}
              </span>
            </Link>
            <button
              onClick={() => setRemindersOpen(true)}
              className="relative flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]"
            >
              <span>🔔</span>
              Reminders
              {reminderCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white shadow-sm">
                  {reminderCount > 9 ? "9+" : reminderCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFormOpen((v) => !v)}
              className="flex w-fit items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              <span>{formOpen ? "✕" : "+"}</span>
              {formOpen ? "Close Form" : "Register Complaint"}
            </button>
          </div>
        </div>

        {/* ── Stat dashboard ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Active Complaints"
            value={summary.activeCount}
            icon="📋"
            tone="indigo"
            onClick={() => setActiveTab("all")}
            active={activeTab === "all"}
          />
          <StatCard
            label="Due Today"
            value={tabCounts["due-today"]}
            icon="📅"
            tone="amber"
            onClick={() => setActiveTab("due-today")}
            active={activeTab === "due-today"}
          />
          <StatCard
            label="Non-Visiting 7d+"
            value={tabCounts["non-visiting"]}
            icon="⚠️"
            tone="red"
            onClick={() => setActiveTab("non-visiting")}
            active={activeTab === "non-visiting"}
          />
          <StatCard label="Completed Today" value={summary.completedToday} icon="✅" tone="emerald" />
        </div>

        {/* ── Add Complaint (collapsible) ── */}
        {formOpen && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-[popIn_0.15s_ease-out]">
            <h2 className="mb-4 text-base font-semibold text-slate-800">Register Complaint</h2>
            <form onSubmit={handleAddEntry} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleFormChange}
                  placeholder="e.g. Rahul Sharma"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Mobile Number</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={form.mobileNumber}
                  onChange={handleFormChange}
                  placeholder="9876543210"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Product</label>
                <select name="product" value={form.product} onChange={handleFormChange} className={inputCls}>
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Who Will Go</label>
                <select name="assignedTo" value={form.assignedTo} onChange={handleFormChange} className={inputCls}>
                  {ASSIGNEES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  placeholder="Site / delivery address"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Follow-up Date</label>
                <input
                  type="date"
                  name="followUpDate"
                  value={form.followUpDate}
                  onChange={handleFormChange}
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Remark <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  name="remark"
                  value={form.remark}
                  onChange={handleFormChange}
                  placeholder="Optional remark"
                  className={inputCls}
                />
              </div>

              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
                <p className="text-xs text-slate-400">
                  Will be registered as <span className="font-semibold text-slate-500">{actorName}</span>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* ── Complaints Table ── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Header row */}
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-slate-800">Active Complaints</h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                {tabbedEntries.length} shown
              </span>
            </div>
            <button
              onClick={handleExport}
              disabled={tabbedEntries.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>⬇</span> Export CSV
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-slate-200 px-5 py-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === t.key
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {t.label} ({tabCounts[t.key] ?? 0})
              </button>
            ))}
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
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Mobile</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Assigned To</th>
                  <th className="px-5 py-3">Follow-up Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated By</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-5 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : tabbedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                      No complaints found.
                    </td>
                  </tr>
                ) : (
                  tabbedEntries.map((entry) => {
                    const nonVisiting = isNonVisiting(entry);
                    return (
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
                        <td className="px-5 py-3 text-slate-700">{formatDate(entry.followUpDate)}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={entry.status} nonVisiting={nonVisiting} />
                        </td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Avatar name={lastActor(entry)} size={6} />
                            {lastActor(entry)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={(e) => toggleMenu(e, entry)}
                            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                              openMenuId === entry._id
                                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                : "border-slate-300 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            Actions ▾
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Actions dropdown: rendered at the root, positioned fixed to the
           viewport from the trigger's bounding rect, so it always lands
           correctly and is never clipped by the table's scroll container. ── */}
      {openMenuId &&
        (() => {
          const entry = tabbedEntries.find((e) => e._id === openMenuId);
          if (!entry) return null;
          return (
            <div
              ref={menuRef}
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed z-50 w-48 origin-top-right overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl animate-[menuIn_0.12s_ease-out]"
            >
              {ACTIONS.map((action) => (
                <button
                  key={action.status}
                  onClick={() => openActionModal(entry, action)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition ${action.cls}`}
                >
                  <span className="w-4 text-center">{action.icon}</span>
                  {action.label}
                </button>
              ))}
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => openEditModal(entry)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span className="w-4 text-center">✎</span>
                Edit
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(entry);
                  setOpenMenuId(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-700 transition hover:bg-red-50"
              >
                <span className="w-4 text-center">🗑</span>
                Delete
              </button>
            </div>
          );
        })()}

      {/* ── Shared Action Modal (Complete / Need Visit / Follow Up / Call-Site) ── */}
      {actionModal && (
        <Modal
          onClose={closeActionModal}
          icon={actionModal.icon}
          title={actionModal.label}
          subtitle={actionModal.entry.customerName}
          accent={actionModal.accent}
        >
          <form onSubmit={handleActionSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Remark</label>
              <textarea
                value={actionForm.remark}
                onChange={(e) => setActionForm((prev) => ({ ...prev, remark: e.target.value }))}
                rows={3}
                autoFocus
                className={inputCls}
              />
            </div>
            {actionModal.status === "follow-up" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Follow-up Date</label>
                <input
                  type="date"
                  value={actionForm.followUpDate}
                  onChange={(e) => setActionForm((prev) => ({ ...prev, followUpDate: e.target.value }))}
                  className={inputCls}
                />
              </div>
            )}
            <p className="text-xs text-slate-400">
              This will be logged as done by <span className="font-semibold text-slate-500">{actorName}</span>
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeActionModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editingEntry && (
        <Modal onClose={closeEditModal} maxWidth="max-w-md" icon="✎" title="Edit Complaint" subtitle={editingEntry.customerName} accent="indigo">
          <form onSubmit={handleEditSave} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Customer Name</label>
              <input type="text" name="customerName" value={editForm.customerName} onChange={handleEditChange} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Mobile Number</label>
              <input type="tel" name="mobileNumber" value={editForm.mobileNumber} onChange={handleEditChange} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Address</label>
              <input type="text" name="address" value={editForm.address} onChange={handleEditChange} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Product</label>
              <select name="product" value={editForm.product} onChange={handleEditChange} className={inputCls}>
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Who Will Go</label>
              <select name="assignedTo" value={editForm.assignedTo} onChange={handleEditChange} className={inputCls}>
                {ASSIGNEES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Follow-up Date</label>
              <input type="date" name="followUpDate" value={editForm.followUpDate} onChange={handleEditChange} className={inputCls} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)} icon="🗑" title="Delete Complaint" accent="red">
          <p className="mb-5 text-sm text-slate-600">
            Are you sure you want to delete the complaint for &quot;{deleteTarget.customerName}&quot;? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {submitting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Detail Modal (full history timeline) ── */}
      {detailEntry &&
        (() => {
          const d = detailData || detailEntry;
          const nonVisiting = isNonVisiting(d);
          return (
            <Modal
              onClose={closeDetail}
              maxWidth="max-w-md"
              icon={STATUS_ICON[d.status]}
              title={d.customerName}
              subtitle={`${d.product} · ${d.assignedTo}`}
              accent={STATUS_ACCENT[d.status]}
            >
              {detailLoading && (
                <div className="mb-3 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              )}
              {detailError && <p className="mb-3 text-sm text-red-500">{detailError}</p>}

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <StatusBadge status={d.status} nonVisiting={nonVisiting} />
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
                    <p className="text-xs text-slate-400">Follow-up Date</p>
                    <p className="font-medium text-slate-700">{formatDate(d.followUpDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Last Updated</p>
                    <p className="font-medium text-slate-700">{formatDateTime(d.lastUpdatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Registered By</p>
                    <p className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Avatar name={d.registeredBy} size={5} />
                      {d.registeredBy || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Last Updated By</p>
                    <p className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Avatar name={lastActor(d)} size={5} />
                      {lastActor(d)}
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

      {/* ── Reminders Popup ── */}
      {remindersOpen && (
        <Modal onClose={() => setRemindersOpen(false)} maxWidth="max-w-md" icon="🔔" title="Reminders" accent="amber">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Due Today ({summary.todayDue.length})
          </p>
          <div className="mb-4 max-h-40 space-y-1.5 overflow-y-auto">
            {summary.todayDue.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing due today.</p>
            ) : (
              summary.todayDue.map((entry) => (
                <button
                  key={entry._id}
                  onClick={() => {
                    setRemindersOpen(false);
                    openDetail(entry);
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left text-sm transition hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-700">{entry.customerName}</span>
                  <StatusBadge status={entry.status} />
                </button>
              ))
            )}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Last 7 Days Pending ({summary.last7DaysPending.length})
          </p>
          <div className="max-h-40 space-y-1.5 overflow-y-auto">
            {summary.last7DaysPending.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing pending in the last 7 days.</p>
            ) : (
              summary.last7DaysPending.map((entry) => (
                <button
                  key={entry._id}
                  onClick={() => {
                    setRemindersOpen(false);
                    openDetail(entry);
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left text-sm transition hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-700">{entry.customerName}</span>
                  <span className="text-xs text-slate-400">{formatDate(entry.followUpDate)}</span>
                </button>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
