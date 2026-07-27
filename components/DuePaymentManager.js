"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import CompleteModal from "./CompleteModal";

const emptyForm = {
  customerName: "",
  amount: "",
  dueDate: "",
  mobile: "",
  mobile2: "",
  note: "",
  referencedBy: "",
};

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all ${isError ? "bg-red-600" : "bg-emerald-600"
        }`}
      role="status"
    >
      {toast.message}
    </div>
  );
}

// ── Referenced By select ──────────────────────────────────────────────────
// Collection role: pick only from existing list.
// Admin: pick from list OR add a brand new name (persisted via API).
function ReferenceSelect({ value, onChange, isAdmin, references, onReferenceAdded }) {
  const [adding, setAdding] = useState(false);
  const [newRef, setNewRef] = useState("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");

  async function handleAdd() {
    const trimmed = newRef.trim();
    if (!trimmed) {
      setAddError("Enter a name.");
      return;
    }
    setSaving(true);
    setAddError("");
    try {
      const res = await fetch("/api/due-payments/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onReferenceAdded(data.references);
        onChange(trimmed);
        setNewRef("");
        setAdding(false);
      } else {
        setAddError(data.message || "Failed to add.");
      }
    } catch {
      setAddError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">— None —</option>
          {references.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setAdding((a) => !a);
              setAddError("");
              setNewRef("");
            }}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold whitespace-nowrap transition ${adding
              ? "border-slate-200 bg-slate-100 text-slate-500"
              : "border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100"
              }`}
          >
            {adding ? "✕ Cancel" : "+ New"}
          </button>
        )}
      </div>
      {adding && isAdmin && (
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <input
              type="text"
              placeholder="New reference name"
              value={newRef}
              onChange={(e) => {
                setNewRef(e.target.value);
                setAddError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {addError && <p className="mt-1 text-xs text-red-500">{addError}</p>}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="whitespace-nowrap rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DuePaymentManager() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [entries, setEntries] = useState([]);
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [completingEntry, setCompletingEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Detail popup state ──
  // detailEntry = the row that was clicked (used immediately for the header
  // while the full record is fetched). detailData = full record from
  // GET /api/due-payments/[id], which has rescheduleHistory, amountGiven, etc.
  const [detailEntry, setDetailEntry] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Duplicate-mobile confirmation (admin override flow)
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { message, existingEntry, pendingPayload }

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [referenceFilter, setReferenceFilter] = useState(""); // "" = All

  // Alphabetical sort toggle ("" = no sort / default order, "asc" = A→Z, "desc" = Z→A)
  const [sortAlpha, setSortAlpha] = useState("");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/due-payments");
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
      } else {
        showToast(data.message || "Failed to load due reminders", "error");
      }
    } catch {
      showToast("Something went wrong while loading due reminders", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchReferences = useCallback(async () => {
    try {
      const res = await fetch("/api/due-payments/references");
      const data = await res.json();
      if (data.success) setReferences(data.references || []);
    } catch {
      // non-fatal — dropdown just stays empty
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchReferences();
  }, [fetchEntries, fetchReferences]);

  // ---- Combined filter + sort: search + reference + alphabetical ----
  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = entries.filter((entry) => {
      // Reference filter
      if (referenceFilter) {
        const ref = (entry.referencedBy || "").trim();
        if (ref !== referenceFilter) return false;
      }
      // Search filter
      if (term) {
        const name = (entry.customerName || "").toLowerCase();
        const mobile = (entry.mobile || "").toLowerCase();
        const mobile2 = (entry.mobile2 || "").toLowerCase();
        if (!name.includes(term) && !mobile.includes(term) && !mobile2.includes(term)) return false;
      }
      return true;
    });

    if (sortAlpha) {
      result.sort((a, b) => {
        const cmp = (a.customerName || "").localeCompare(b.customerName || "", "en", {
          sensitivity: "base",
        });
        return sortAlpha === "desc" ? -cmp : cmp;
      });
    }

    return result;
  }, [entries, searchTerm, referenceFilter, sortAlpha]);

  // Cycle: off → A→Z → Z→A → off
  const toggleSortAlpha = () => {
    setSortAlpha((prev) => (prev === "" ? "asc" : prev === "asc" ? "desc" : ""));
  };

  // ---- Add entry ----
  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitNewEntry = async (payload) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/due-payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showToast("Due Reminder added successfully");
        setForm(emptyForm);
        setDuplicateWarning(null);
        fetchEntries();
        return;
      }

      // Duplicate mobile number on a pending entry
      if (data.duplicate) {
        if (data.canForce) {
          // Admin: show confirmation, offer to force-create
          setDuplicateWarning({
            message: data.message,
            existingEntry: data.existingEntry,
            pendingPayload: payload,
          });
        } else {
          showToast(data.message || "A pending entry already exists for this mobile number", "error");
        }
        return;
      }

      showToast(data.message || "Failed to add due reminder", "error");
    } catch {
      showToast("Something went wrong while adding due reminder", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.amount || !form.dueDate) {
      showToast("Name, amount and due date are required", "error");
      return;
    }
    await submitNewEntry(form);
  };

  const handleForceAdd = async () => {
    if (!duplicateWarning) return;
    await submitNewEntry({ ...duplicateWarning.pendingPayload, force: true });
  };

  const handleReferenceAdded = (newList) => setReferences(newList);

  // ---- Edit entry ----
  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      customerName: entry.customerName,
      amount: entry.amount,
      dueDate: entry.dueDate ? entry.dueDate.slice(0, 10) : "",
      mobile: entry.mobile || "",
      mobile2: entry.mobile2 || "",
      note: entry.note || "",
      referencedBy: entry.referencedBy || "",
    });
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
    if (!editForm.customerName.trim() || !editForm.amount || !editForm.dueDate) {
      showToast("Name, amount and due date are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/due-payments/${editingEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editForm.customerName,
          amount: editForm.amount,
          dueDate: editForm.dueDate,
          mobile: editForm.mobile,
          mobile2: editForm.mobile2,
          note: editForm.note,
          referencedBy: editForm.referencedBy,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Due Reminder updated successfully");
        closeEditModal();
        fetchEntries();
      } else {
        showToast(data.message || "Failed to update due reminder", "error");
      }
    } catch {
      showToast("Something went wrong while updating due reminder", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/due-payments/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Due Reminder deleted successfully");
        fetchEntries();
      } else {
        showToast(data.message || "Failed to delete", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
    }
  };

  // ---- Detail popup ----
  // Fetches the full record from the server instead of relying on whatever
  // fields the list endpoint happened to include, so rescheduleHistory /
  // amountGiven etc always show up.
  const openDetail = useCallback(async (entry) => {
    setDetailEntry(entry);
    setDetailData(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/due-payments/${entry._id}`);
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

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* ── Add Due Payment ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Add Reminder</h2>
        <form
          onSubmit={handleAddEntry}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Customer Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Customer Name</label>
            <input
              type="text"
              name="customerName"
              value={form.customerName}
              onChange={handleFormChange}
              placeholder="e.g. Rahul Sharma"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">AMT </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleFormChange}
              placeholder="5000"
              min="0"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleFormChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Primary Mobile</label>
            <input
              type="tel"
              name="mobile"
              value={form.mobile}
              onChange={handleFormChange}
              placeholder="9876543210"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Secondary Mobile */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Secondary Mobile <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="tel"
              name="mobile2"
              value={form.mobile2}
              onChange={handleFormChange}
              placeholder="9876543210"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Referenced By — dropdown selection */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Referenced By{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <ReferenceSelect
              value={form.referencedBy}
              onChange={(v) => setForm((prev) => ({ ...prev, referencedBy: v }))}
              isAdmin={isAdmin}
              references={references}
              onReferenceAdded={handleReferenceAdded}
            />
          </div>

          {/* Note */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">Note</label>
            <input
              type="text"
              name="note"
              value={form.note}
              onChange={handleFormChange}
              placeholder="Optional note"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Pending Payments Table ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Table header / filters */}
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-800">Pending Reminders</h2>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              {filteredEntries.length} {searchTerm || referenceFilter ? "found" : "pending"}
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* A–Z sort toggle */}
            <button
              type="button"
              onClick={toggleSortAlpha}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                sortAlpha
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              title="Sort alphabetically by name"
            >
              <svg
                className="h-4 w-4"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m6 6l3-3m0 0l3 3m-3-3v12" />
              </svg>
              {sortAlpha === "desc" ? "Z–A" : "A–Z"}
            </button>

            {/* Reference filter dropdown */}
            <div className="relative">
              <select
                value={referenceFilter}
                onChange={(e) => setReferenceFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-48"
              >
                <option value="">All References</option>
                {references.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {/* chevron icon */}
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Active reference badge (clear button) */}
            {referenceFilter && (
              <button
                onClick={() => setReferenceFilter("")}
                className="flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
              >
                {referenceFilter} ✕
              </button>
            )}

            {/* Search box */}
            <div className="relative w-full sm:w-56">
              <svg
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or mobile"
                className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-8 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">AMT</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Mobile</th>
                <th className="px-5 py-3">Referenced By</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Loading entries...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No pending due Reminders. Add one above.
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No results match the current filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry._id}
                    onClick={() => openDetail(entry)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {entry.customerName}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {(() => { const s = String(Math.trunc(Number(entry.amount))); return s.length <= 1 ? s : s[0] + "." + s.slice(1); })()}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {formatDate(entry.dueDate)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-0.5">
                        {entry.mobile ? (
                          <a href={`tel:${entry.mobile}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sky-600 hover:text-sky-800 hover:underline text-sm transition"
                          >
                            +91 {entry.mobile}
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {entry.mobile2 && (
                          <a href={`tel:${entry.mobile2}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-slate-400 hover:text-sky-600 hover:underline transition"
                          >
                            +91 {entry.mobile2}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {entry.referencedBy ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setReferenceFilter(entry.referencedBy); }}
                          className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 transition"
                          title={`Filter by ${entry.referencedBy}`}
                        >
                          {entry.referencedBy}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium capitalize text-amber-700">
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(entry); }}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCompletingEntry(entry); }}
                          className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Complete
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(entry); }}
                          className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {
        editingEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Reminder</h3>
              <form onSubmit={handleEditSave} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Customer Name</label>
                  <input type="text" name="customerName" value={editForm.customerName}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">AMT (₹)</label>
                  <input type="number" name="amount" value={editForm.amount} min="0"
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Due Date</label>
                  <input type="date" name="dueDate" value={editForm.dueDate}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Primary Mobile</label>
                  <input type="tel" name="mobile" value={editForm.mobile}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Secondary Mobile <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input type="tel" name="mobile2" value={editForm.mobile2}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>

                {/* Referenced By dropdown in edit modal */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Referenced By <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <ReferenceSelect
                    value={editForm.referencedBy}
                    onChange={(v) => setEditForm((prev) => ({ ...prev, referencedBy: v }))}
                    isAdmin={isAdmin}
                    references={references}
                    onReferenceAdded={handleReferenceAdded}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Note</label>
                  <textarea name="note" value={editForm.note} onChange={handleEditChange} rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeEditModal}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* ── Complete Modal ── */}
      {
        completingEntry && (
          <CompleteModal
            entry={completingEntry}
            onClose={() => setCompletingEntry(null)}
            onSuccess={() => { setCompletingEntry(null); fetchEntries(); }}
            showToast={showToast}
          />
        )
      }

      {/* ── Delete Confirm Modal ── */}
      {
        deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
              <h3 className="mb-2 text-base font-semibold text-slate-800">Delete Due Reminder</h3>
              <p className="mb-5 text-sm text-slate-600">
                Are you sure you want to delete the entry for &quot;{deleteTarget.customerName}&quot;? This cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={submitting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                  {submitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ── Duplicate Mobile Warning (admin override) ── */}
      {
        duplicateWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
              <h3 className="mb-2 text-base font-semibold text-amber-700">⚠ Duplicate Mobile Number</h3>
              <p className="mb-5 text-sm text-slate-600">{duplicateWarning.message}</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDuplicateWarning(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Cancel
                </button>
                <button onClick={handleForceAdd} disabled={submitting}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60">
                  {submitting ? "Adding..." : "Add Anyway"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ── Entry Detail Modal ── */}
      {/* Uses detailData (fetched from GET /api/due-payments/[id]) once it
          arrives, falling back to the row data (detailEntry) for the header
          so the modal isn't blank while loading. */}
      {
        detailEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeDetail}>
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              {(() => {
                const d = detailData || detailEntry;
                return (
                  <>
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800">{d.customerName}</h3>
                        <p className="text-xs text-slate-400">
                          {formatDate(d.dueDate)} · ₹{Number(d.amount).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <button onClick={closeDetail} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">✕</button>
                    </div>

                    {detailLoading && <p className="mb-3 text-sm text-slate-400">Loading details…</p>}
                    {detailError && <p className="mb-3 text-sm text-red-500">{detailError}</p>}

                    {d.referencedBy && (
                      <span className="mb-2 inline-block rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                        {d.referencedBy}
                      </span>
                    )}
                    {d.note && <p className="mb-3 text-sm italic text-slate-500">{d.note}</p>}

                    <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">Collected So Far</p>
                        <p className="font-semibold text-emerald-700">₹{Number(d.amountGiven || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Mobile</p>
                        <p className="font-semibold text-slate-700">{d.mobile || "—"}</p>
                      </div>
                    </div>

                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Reschedule History</p>
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {(d.rescheduleHistory || []).length === 0 ? (
                        <p className="text-sm text-slate-400">No reschedules yet.</p>
                      ) : (
                        d.rescheduleHistory.slice().reverse().map((r, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs">
                            <span className={`rounded-full px-2 py-0.5 font-medium ${r.type === "call" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"}`}>
                              {r.type === "call" ? "📞 On Call" : "🏠 On-site"}
                            </span>
                            <span className="text-slate-500">
                              {formatDate(r.previousDueDate)} → {formatDate(r.newDueDate)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )
      }
    </div >
  );
}