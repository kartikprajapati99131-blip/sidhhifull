"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";

const CAN_SEE_ALL_ROLES = ["admin", "sales"];

const EMPTY_FORM = {
  mobile1: "",
  mobile2: "",
  name: "",
  siteAddress: "",
  permanentAddress: "",
  profession: "",
  mistryName: "",
  mistryNumber: "",
  architectName: "",
  architectNumber: "",
  nextMeetingDate: "",
  remark: "",
};

const CUSTOMER_FIELDS = [
  { name: "mobile1", label: "Mobile No 1", type: "tel", required: true, half: true },
  { name: "mobile2", label: "Mobile No 2", type: "tel", half: true },
  { name: "name", label: "Customer Name", required: true, half: true },
  { name: "profession", label: "Profession", half: true },
  { name: "siteAddress", label: "Site Address", textarea: true },
  { name: "permanentAddress", label: "Permanent Address", textarea: true },
  { name: "mistryName", label: "Mistry Name", half: true },
  { name: "mistryNumber", label: "Mistry Number", type: "tel", half: true },
  { name: "architectName", label: "Architect Name", half: true },
  { name: "architectNumber", label: "Architect Number", type: "tel", half: true },
];

const MISTRY_FIELDS = [
  { name: "mobile1", label: "Mobile No 1", type: "tel", required: true, half: true },
  { name: "mobile2", label: "Mobile No 2", type: "tel", half: true },
  { name: "name", label: "Mistry Name", required: true, half: true },
];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  "site-confirmed": "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

const ACTION_TITLES = {
  cancel: "Why is this being cancelled?",
  call: "Log a call",
  onsite: "Log on-site visit",
  "site-confirm": "Confirm site",
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const isDueOrOverdue = (e) => e.status === "pending" && e.nextMeetingDate && e.nextMeetingDate <= todayStr();

function fmtDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all ${isError ? "bg-red-600" : "bg-emerald-600"}`}
      role="status"
    >
      {toast.message}
    </div>
  );
}

function CallLink({ number, className }) {
  if (!number) return <span className="text-slate-400">—</span>;
  return (
    <a href={`tel:${number}`} onClick={(e) => e.stopPropagation()} className={className || "text-sky-600 hover:text-sky-800 hover:underline"}>
      {number}
    </a>
  );
}

function Field({ field, value, onChange }) {
  const common = {
    id: field.name,
    name: field.name,
    value: value ?? "",
    onChange: (e) => onChange(field.name, e.target.value),
    required: !!field.required,
    className:
      "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
    placeholder: field.label,
  };
  return (
    <div className={field.half ? "sm:col-span-1" : "sm:col-span-2"}>
      <label htmlFor={field.name} className="mb-1 block text-xs font-medium text-slate-600">
        {field.label}
        {field.required && <span className="text-rose-500"> *</span>}
      </label>
      {field.textarea ? <textarea rows={2} {...common} /> : <input type={field.type || "text"} {...common} />}
    </div>
  );
}

export default function EntryManager() {
  const { data: session } = useSession();
  const currentUser = {
    id: session?.user?.id,
    name: session?.user?.name || "Me",
    role: session?.user?.role || "staff",
  };
  const canSeeAll = CAN_SEE_ALL_ROLES.includes(currentUser.role);
  const isAdmin = currentUser.role === "admin";

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [entryType, setEntryType] = useState("customer");
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const [editingEntry, setEditingEntry] = useState(null);
  const [editEntryType, setEditEntryType] = useState("customer");
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [actionModal, setActionModal] = useState(null); // { entry, action }
  const [actionText, setActionText] = useState("");
  const [actionNextDate, setActionNextDate] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { message, existingEntry, pendingPayload }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notifOpen, setNotifOpen] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/entries");
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
      } else {
        showToast(data.message || "Failed to load entries", "error");
      }
    } catch {
      showToast("Something went wrong while loading entries", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const dueEntries = useMemo(() => entries.filter(isDueOrOverdue), [entries]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => (statusFilter === "all" ? true : e.status === statusFilter))
      .filter((e) => {
        if (!q) return true;
        return (
          e.name?.toLowerCase().includes(q) ||
          e.mobile1?.includes(q) ||
          e.mobile2?.includes(q) ||
          e.siteAddress?.toLowerCase().includes(q)
        );
      });
  }, [entries, search, statusFilter]);

  // ── Add entry ──────────────────────────────────────────────────────────
  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  const submitNewEntry = async (payload) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showToast("Entry added successfully");
        setDuplicateWarning(null);
        resetForm();
        fetchEntries();
        return;
      }

      if (data.duplicate) {
        setDuplicateWarning({ message: data.message, existingEntry: data.existingEntry, pendingPayload: payload });
        return;
      }

      showToast(data.message || "Failed to add entry", "error");
    } catch {
      showToast("Something went wrong while adding the entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    const fields = entryType === "customer" ? CUSTOMER_FIELDS : MISTRY_FIELDS;
    for (const f of fields) {
      if (f.required && !form[f.name]?.trim()) {
        showToast(`${f.label} is required`, "error");
        return;
      }
    }
    await submitNewEntry({ type: entryType, ...form });
  };

  const handleForceAdd = async () => {
    if (!duplicateWarning) return;
    await submitNewEntry({ ...duplicateWarning.pendingPayload, force: true });
  };

  // ── Edit entry ─────────────────────────────────────────────────────────
  function openEditModal(entry) {
    setEditingEntry(entry);
    setEditEntryType(entry.type);
    setEditForm({
      mobile1: entry.mobile1 || "",
      mobile2: entry.mobile2 || "",
      name: entry.name || "",
      siteAddress: entry.siteAddress || "",
      permanentAddress: entry.permanentAddress || "",
      profession: entry.profession || "",
      mistryName: entry.mistryName || "",
      mistryNumber: entry.mistryNumber || "",
      architectName: entry.architectName || "",
      architectNumber: entry.architectNumber || "",
      nextMeetingDate: entry.nextMeetingDate || "",
      remark: "",
    });
  }

  function closeEditModal() {
    setEditingEntry(null);
    setEditForm(EMPTY_FORM);
  }

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    const fields = editEntryType === "customer" ? CUSTOMER_FIELDS : MISTRY_FIELDS;
    for (const f of fields) {
      if (f.required && !editForm[f.name]?.trim()) {
        showToast(`${f.label} is required`, "error");
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/entries/${editingEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Entry updated successfully");
        closeEditModal();
        fetchEntries();
      } else {
        showToast(data.message || "Failed to update entry", "error");
      }
    } catch {
      showToast("Something went wrong while updating the entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete (admin/sales only) ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/entries/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Entry deleted successfully");
        fetchEntries();
      } else {
        showToast(data.message || "Failed to delete entry", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
    }
  };

  // ── Status actions: call / onsite / cancel / site-confirm ──────────────
  function openActionModal(entry, action) {
    setActionModal({ entry, action });
    setActionText("");
    setActionNextDate(entry.nextMeetingDate || "");
  }

  const submitAction = async () => {
    if (!actionModal) return;
    const { entry, action } = actionModal;
    if (action === "cancel" && !actionText.trim()) {
      showToast("A reason is required to cancel", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: actionText.trim(),
          nextMeetingDate: action === "call" || action === "onsite" ? actionNextDate : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Entry updated successfully");
        setActionModal(null);
        setNotifOpen(false);
        fetchEntries();
      } else {
        showToast(data.message || "Failed to update entry", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const fields = entryType === "customer" ? CUSTOMER_FIELDS : MISTRY_FIELDS;
  const editFields = editEntryType === "customer" ? CUSTOMER_FIELDS : MISTRY_FIELDS;

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* ── Header row: visibility note + notifications + add button ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Signed in as <span className="font-medium text-slate-700">{currentUser.name}</span> ·{" "}
          <span className="capitalize">{currentUser.role}</span> · {canSeeAll ? "viewing all entries" : "viewing your entries only"}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Due &amp; overdue
            {dueEntries.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {dueEntries.length}
              </span>
            )}
          </button>
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            {showForm ? "Close form" : "+ Add entry"}
          </button>
        </div>
      </div>

      {notifOpen && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="mb-2 text-sm font-semibold text-slate-800">Today &amp; overdue meetings</h4>
          {dueEntries.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-400">Nothing due right now.</p>
          ) : (
            <ul className="space-y-2">
              {dueEntries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-2.5">
                  <div>
                    <span className="text-sm font-medium text-slate-800">{entry.name}</span>
                    <span className="ml-2 text-xs text-red-600">{entry.nextMeetingDate}</span>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {entry.type === "customer" ? "Customer" : "Mistry"} · <CallLink number={entry.mobile1} />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openActionModal(entry, "call")} className="rounded-md bg-sky-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-sky-700">Call</button>
                    <button onClick={() => openActionModal(entry, "onsite")} className="rounded-md bg-violet-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-violet-700">On-site</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Add Entry form ── */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-end justify-between">
            <div className="max-w-xs">
              <label className="mb-1 block text-xs font-medium text-slate-600">Entry type</label>
              <select
                value={entryType}
                onChange={(e) => { setEntryType(e.target.value); setForm(EMPTY_FORM); }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="customer">Customer</option>
                <option value="mistry">Mistry</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleAddEntry} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <Field key={f.name} field={f} value={form[f.name]} onChange={updateField} />
            ))}
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Next meeting date</label>
              <input
                type="date"
                value={form.nextMeetingDate}
                onChange={(e) => updateField("nextMeetingDate", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Remark</label>
              <textarea
                rows={2}
                value={form.remark}
                onChange={(e) => updateField("remark", e.target.value)}
                placeholder="Any note about this entry…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={resetForm} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {submitting ? "Saving…" : `Save ${entryType}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Entries table ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-800">Entries</h2>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              {filteredEntries.length} {search || statusFilter !== "all" ? "found" : "total"}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="site-confirmed">Site Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, mobile, address…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-8 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Mobile</th>
                <th className="px-5 py-3">Next meeting</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Added by</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">Loading entries…</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">No entries yet. Tap "+ Add entry" to create one.</td></tr>
              ) : filteredEntries.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">No results match the current filters.</td></tr>
              ) : (
                filteredEntries.map((entry) => {
                  const disabled = entry.status === "cancelled";
                  return (
                    <tr key={entry.id} className="align-top hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{entry.name || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${entry.type === "customer" ? "bg-indigo-50 text-indigo-700" : "bg-orange-50 text-orange-700"}`}>
                          {entry.type === "customer" ? "Customer" : "Mistry"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <CallLink number={entry.mobile1} />
                          {entry.mobile2 && <CallLink number={entry.mobile2} className="text-xs text-slate-400 hover:text-sky-600 hover:underline" />}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {entry.nextMeetingDate || "—"}
                        {isDueOrOverdue(entry) && (
                          <span className="ml-1.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                            {entry.nextMeetingDate === todayStr() ? "Due today" : "Overdue"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[entry.status]}`}>{entry.status}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{entry.createdBy?.name} <span className="text-slate-400">({entry.createdBy?.role})</span></td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button disabled={disabled} onClick={() => openActionModal(entry, "site-confirm")} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40">Confirm</button>
                          <button disabled={disabled} onClick={() => openActionModal(entry, "call")} className="rounded-md bg-sky-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-40">Call</button>
                          <button disabled={disabled} onClick={() => openActionModal(entry, "onsite")} className="rounded-md bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-40">On-site</button>
                          <button disabled={disabled} onClick={() => openActionModal(entry, "cancel")} className="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-40">Cancel</button>
                          <button onClick={() => openEditModal(entry)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">Edit</button>
                          {canSeeAll && (
                            <button onClick={() => setDeleteTarget(entry)} className="rounded-md border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">Delete</button>
                          )}
                        </div>
                        {entry.history?.length > 0 && (
                          <details className="mt-2 text-xs text-slate-500">
                            <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">History ({entry.history.length})</summary>
                            <ul className="mt-1.5 space-y-1 text-left">
                              {entry.history.slice().reverse().map((h) => (
                                <li key={h.id}>
                                  <span className="font-medium text-slate-700 capitalize">{h.type.replace("-", " ")}</span>
                                  {" · "}{h.by?.name} · {fmtDateTime(h.at)}
                                  {h.text && <div className="text-slate-500">{h.text}</div>}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeEditModal}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-semibold text-slate-800">Edit {editEntryType === "customer" ? "Customer" : "Mistry"}</h3>
            <form onSubmit={handleEditSave} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {editFields.map((f) => (
                <Field key={f.name} field={f} value={editForm[f.name]} onChange={(name, value) => setEditForm((p) => ({ ...p, [name]: value }))} />
              ))}
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Next meeting date</label>
                <input
                  type="date"
                  value={editForm.nextMeetingDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, nextMeetingDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
                <button type="button" onClick={closeEditModal} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                  {submitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Action Modal (call / on-site / cancel / site-confirm) ── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setActionModal(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-800">{ACTION_TITLES[actionModal.action]}</h3>
            <textarea
              autoFocus
              rows={3}
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              placeholder={actionModal.action === "cancel" ? "Reason for cancelling…" : "Optional remark…"}
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {(actionModal.action === "call" || actionModal.action === "onsite") && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">Next meeting date</label>
                <input
                  type="date"
                  value={actionNextDate}
                  onChange={(e) => setActionNextDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setActionModal(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Close</button>
              <button
                disabled={submitting || (actionModal.action === "cancel" && !actionText.trim())}
                onClick={submitAction}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {submitting ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-slate-800">Delete entry</h3>
            <p className="mb-5 text-sm text-slate-600">
              Are you sure you want to delete the entry for &quot;{deleteTarget.name}&quot;? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
              <button onClick={handleDelete} disabled={submitting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {submitting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Duplicate Mobile Warning ── */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-amber-700">⚠ Number already exists</h3>
            <p className="mb-5 text-sm text-slate-600">{duplicateWarning.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDuplicateWarning(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
              <button onClick={handleForceAdd} disabled={submitting} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60">
                {submitting ? "Saving…" : "Save anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
