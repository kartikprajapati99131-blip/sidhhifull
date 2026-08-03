"use client";

import { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysSince(date) {
  if (!date) return "-";
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatAmount(amount) {
  const s = String(Math.trunc(Number(amount)));
  return s.length <= 1 ? s : s[0] + "." + s.slice(1);
}

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div className={`fixed bottom-5 right-5 z-[100] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${isError ? "bg-red-600" : "bg-emerald-600"}`}>
      {toast.message}
    </div>
  );
}

// ── Single "Actions ▾" dropdown — same 6 actions as the reminder card ──
//
// Rendered with `position: fixed` and coordinates computed from the
// button's own bounding box (instead of `absolute` inside the row).
// This fixes the menu being clipped/misplaced on the last row(s):
//   1. The table wrapper uses `overflow-x-auto`; per the CSS spec,
//      setting only one axis to non-"visible" forces the other axis
//      to compute as "auto" too — so a menu positioned `absolute`
//      inside that wrapper can get clipped instead of showing.
//   2. Even without clipping, a menu that always opens *downward*
//      has nowhere to go from the last row and renders partly off
//      screen. It now flips upward automatically when there isn't
//      enough room below the button.
const MENU_WIDTH = 208; // w-52
const MENU_HEIGHT_ESTIMATE = 260; // enough for 6 items, only used for the flip decision

function ActionsMenu({ entry, onEdit, onFollowUp, onOnsite, onNoAnswer, onHistory }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null); // { top, left, openUp }
  const btnRef = useState(() => ({ current: null }))[0];

  const close = () => setOpen(false);

  const toggleOpen = () => {
    if (open) { close(); return; }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < MENU_HEIGHT_ESTIMATE && rect.top > spaceBelow;
      const left = Math.min(
        Math.max(rect.right - MENU_WIDTH, 8),
        window.innerWidth - MENU_WIDTH - 8
      );
      setCoords({
        left,
        top: openUp ? rect.top - 4 : rect.bottom + 4,
        openUp,
      });
    }
    setOpen(true);
  };

  const historyCount = (entry.rescheduleHistory || []).length;

  const actions = [
    { label: "✏️ Edit", onClick: () => onEdit(entry) },
    { label: "📞 Call", href: entry.mobile ? `tel:${entry.mobile}` : null, disabled: !entry.mobile },
    { label: "✅ Done Calling", onClick: () => onFollowUp(entry) },
    { label: "🏠 On-site", onClick: () => onOnsite(entry) },
    { label: "📵 No Call", onClick: () => onNoAnswer(entry), danger: true },
    { label: `🕑 History${historyCount > 0 ? ` (${historyCount})` : ""}`, onClick: () => onHistory(entry) },
  ];

  return (
    <div className="inline-block text-left">
      <button
        ref={(el) => { btnRef.current = el; }}
        onClick={toggleOpen}
        className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
      >
        Actions <span className="text-slate-400">▾</span>
      </button>
      {open && coords && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div
            className="fixed z-50 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
            style={{
              left: coords.left,
              top: coords.openUp ? undefined : coords.top,
              bottom: coords.openUp ? window.innerHeight - coords.top : undefined,
            }}
          >
            {actions.map((a, i) =>
              a.href ? (
                <a key={i} href={a.href} onClick={close}
                  className="block px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  {a.label}
                </a>
              ) : (
                <button key={i} disabled={a.disabled} onClick={() => { close(); a.onClick(); }}
                  className={`block w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${a.danger ? "text-red-600" : "text-slate-700"}`}>
                  {a.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function NoAnswerList() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ----- Edit -----
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({ customerName: "", amount: "", dueDate: "", note: "" });

  // ----- Done Calling (follow-up reschedule) -----
  const [followUpEntry, setFollowUpEntry] = useState(null);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpRemark, setFollowUpRemark] = useState("");
  const [followUpCollected, setFollowUpCollected] = useState("");

  // ----- On-site reschedule -----
  const [onsiteEntry, setOnsiteEntry] = useState(null);
  const [onsiteDate, setOnsiteDate] = useState("");
  const [onsiteRemark, setOnsiteRemark] = useState("");
  const [onsiteCollected, setOnsiteCollected] = useState("");

  // ----- No Call -----
  const [noCallEntry, setNoCallEntry] = useState(null);
  const [noCallRemark, setNoCallRemark] = useState("");

  // ----- History detail popup -----
  const [historyEntry, setHistoryEntry] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/due-payments/no-answer");
      const data = await res.json();
      if (data.success) setEntries(data.data);
      else showToast(data.message || "Failed to load", "error");
    } catch {
      showToast("Something went wrong while loading", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // ----- Edit -----
  const openEdit = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      customerName: entry.customerName,
      amount: entry.amount,
      dueDate: entry.dueDate ? entry.dueDate.slice(0, 10) : "",
      note: entry.note || "",
    });
  };
  const closeEdit = () => setEditingEntry(null);
  const handleEditChange = (e) => setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
          note: editForm.note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Entry updated");
        closeEdit();
        fetchEntries(); // due date may have moved it out of the 7+ day list
      } else {
        showToast(data.message || "Failed to update entry", "error");
      }
    } catch {
      showToast("Something went wrong while updating entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- Done Calling -----
  const openFollowUp = (entry) => {
    setFollowUpEntry(entry);
    setFollowUpDate("");
    setFollowUpRemark("");
    setFollowUpCollected("");
  };
  const closeFollowUp = () => {
    setFollowUpEntry(null);
    setFollowUpDate("");
    setFollowUpRemark("");
    setFollowUpCollected("");
  };

  const handleFollowUpSave = async (e) => {
    e.preventDefault();
    if (!followUpEntry) return;
    if (!followUpDate) { showToast("Please select the next follow up date", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/due-payments/${followUpEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isFollowUp: true,
          dueDate: followUpDate,
          remark: followUpRemark,
          collectedAmount: followUpCollected ? Number(followUpCollected) : 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Follow up date saved — back in the active list");
        setEntries((prev) => prev.filter((e) => e._id !== followUpEntry._id));
        closeFollowUp();
      } else {
        showToast(data.message || "Failed to save follow up date", "error");
      }
    } catch {
      showToast("Something went wrong while saving follow up date", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- On-site Reschedule -----
  const openOnsite = (entry) => {
    setOnsiteEntry(entry);
    setOnsiteDate("");
    setOnsiteRemark("");
    setOnsiteCollected("");
  };
  const closeOnsite = () => {
    setOnsiteEntry(null);
    setOnsiteDate("");
    setOnsiteRemark("");
    setOnsiteCollected("");
  };

  const handleOnsiteSave = async (e) => {
    e.preventDefault();
    if (!onsiteEntry) return;
    if (!onsiteDate) { showToast("Please select the new due date", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/due-payments/${onsiteEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isOnsiteReschedule: true,
          dueDate: onsiteDate,
          remark: onsiteRemark,
          collectedAmount: onsiteCollected ? Number(onsiteCollected) : 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Rescheduled — back in the active list");
        setEntries((prev) => prev.filter((e) => e._id !== onsiteEntry._id));
        closeOnsite();
      } else {
        showToast(data.message || "Failed to reschedule", "error");
      }
    } catch {
      showToast("Something went wrong while rescheduling", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- No Call -----
  const openNoCall = (entry) => {
    setNoCallEntry(entry);
    setNoCallRemark("");
  };
  const closeNoCall = () => {
    setNoCallEntry(null);
    setNoCallRemark("");
  };

  const handleNoCallSave = async (e) => {
    e.preventDefault();
    if (!noCallEntry) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/due-payments/${noCallEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isNoAnswer: true, remark: noCallRemark }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Marked as no call");
        setEntries((prev) =>
          prev.map((entry) => (entry._id === noCallEntry._id ? { ...entry, ...data.data } : entry))
        );
        closeNoCall();
      } else {
        showToast(data.message || "Failed to save", "error");
      }
    } catch {
      showToast("Something went wrong while saving", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- History -----
  const openHistory = (entry) => setHistoryEntry(entry);
  const closeHistory = () => setHistoryEntry(null);

  const handleExportPdf = () => {
    if (!entries.length) {
      showToast("Nothing to export", "error");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(14);
    doc.text("No Answer List (7+ days overdue)", 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated on ${formatDate(new Date())}`, 14, 21);

    const rows = entries.map((entry) => [
      entry.customerName || "-",
      formatAmount(entry.amount),
      entry.mobile ? `+91 ${entry.mobile}` : "-",
      entry.referencedBy?.trim() ? entry.referencedBy : "-",
      formatDate(entry.dueDate),
      `${daysSince(entry.dueDate)} days`,
    ]);

    autoTable(doc, {
      startY: 26,
      head: [["Name", "Amt", "Mobile", "Reference", "Due Date", "Days Overdue"]],
      body: rows,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229] }, // indigo-ish
      columnStyles: { 5: { textColor: [220, 38, 38] } },
    });

    doc.save(`no-answer-list-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <Toast toast={toast} />
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">No Answer (7+ days overdue)</h2>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">{entries.length}</span>
          <button
            onClick={handleExportPdf}
            disabled={loading || entries.length === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export PDF
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">AMT</th>
              <th className="px-5 py-3">Mobile</th>
              <th className="px-5 py-3">Reference</th>
              <th className="px-5 py-3">Due Date</th>
              <th className="px-5 py-3">Days Overdue</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">No stale entries.</td></tr>
            ) : entries.map((entry) => (
              <tr key={entry._id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{entry.customerName}</td>
                <td className="px-5 py-3 text-slate-700">{formatAmount(entry.amount)}</td>
                <td className="px-5 py-3 text-slate-700">
                  {entry.mobile ? (
                    <a href={`tel:${entry.mobile}`} className="text-sky-600 hover:text-sky-800 hover:underline transition">
                      +91 {entry.mobile}
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-700">
                  {entry.referencedBy?.trim() ? entry.referencedBy : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-5 py-3 text-slate-700">{formatDate(entry.dueDate)}</td>
                <td className="px-5 py-3 text-red-600 font-medium">
                  {daysSince(entry.dueDate)} days
                </td>
                <td className="px-5 py-3 text-right">
                  <ActionsMenu
                    entry={entry}
                    onEdit={openEdit}
                    onFollowUp={openFollowUp}
                    onOnsite={openOnsite}
                    onNoAnswer={openNoCall}
                    onHistory={openHistory}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeEdit}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Due Payment</h3>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Customer Name</label>
                <input type="text" name="customerName" value={editForm.customerName} onChange={handleEditChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Amount (₹)</label>
                <input type="number" name="amount" value={editForm.amount} onChange={handleEditChange} min="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Due Date</label>
                <input type="date" name="dueDate" value={editForm.dueDate} onChange={handleEditChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Note</label>
                <textarea name="note" value={editForm.note} onChange={handleEditChange} rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeEdit}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Done Calling Modal */}
      {followUpEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeFollowUp}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-semibold text-slate-800">Schedule Next Follow Up</h3>
            <p className="mb-4 truncate text-sm text-slate-600">
              {followUpEntry.customerName} &middot; ₹{Number(followUpEntry.amount).toLocaleString("en-IN")}
            </p>
            <form onSubmit={handleFollowUpSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Next Follow Up Date</label>
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Amount Collected Now (₹) — optional</label>
                <input type="number" min="0" value={followUpCollected} onChange={(e) => setFollowUpCollected(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Call Remark — optional</label>
                <textarea value={followUpRemark} onChange={(e) => setFollowUpRemark(e.target.value)} rows={2}
                  placeholder="e.g. Asked for 3 more days"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeFollowUp}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* On-site Reschedule Modal */}
      {onsiteEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeOnsite}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-semibold text-slate-800">On-site Reschedule</h3>
            <p className="mb-4 truncate text-sm text-slate-600">
              {onsiteEntry.customerName} &middot; ₹{Number(onsiteEntry.amount).toLocaleString("en-IN")}
            </p>
            <form onSubmit={handleOnsiteSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">New Due Date</label>
                <input type="date" value={onsiteDate} onChange={(e) => setOnsiteDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Amount Collected Now (₹) — optional</label>
                <input type="number" min="0" value={onsiteCollected} onChange={(e) => setOnsiteCollected(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Visit Remark — optional</label>
                <textarea value={onsiteRemark} onChange={(e) => setOnsiteRemark(e.target.value)} rows={2}
                  placeholder="e.g. Met owner, shop closed"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeOnsite}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60">
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* No Call Modal */}
      {noCallEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeNoCall}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-semibold text-slate-800">Mark as No Call</h3>
            <p className="mb-1 truncate text-sm text-slate-600">
              {noCallEntry.customerName} &middot; ₹{Number(noCallEntry.amount).toLocaleString("en-IN")}
            </p>
            <p className="mb-4 text-xs text-slate-400">
              This won&apos;t change the due date — it just logs the call attempt in history.
            </p>
            <form onSubmit={handleNoCallSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Remark — optional</label>
                <textarea value={noCallRemark} onChange={(e) => setNoCallRemark(e.target.value)} rows={2}
                  placeholder="e.g. Rang twice, no pickup"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeNoCall}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                  {submitting ? "Saving..." : "Mark No Call"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Detail Popup */}
      {historyEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeHistory}>
          <div className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-800">Call &amp; Visit History</h3>
                <p className="text-xs text-slate-400">{historyEntry.customerName}</p>
              </div>
              <button onClick={closeHistory} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-2">
              {(historyEntry.rescheduleHistory || []).length === 0 ? (
                <p className="text-sm text-slate-400">No history yet.</p>
              ) : (
                historyEntry.rescheduleHistory.slice().reverse().map((r, i) => (
                  <div key={i} className="rounded-lg border border-slate-100 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${
                        r.type === "call" ? "bg-sky-50 text-sky-700"
                          : r.type === "onsite" ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {r.type === "call" ? "📞 On Call" : r.type === "onsite" ? "🏠 On-site" : "📵 No Call"}
                      </span>
                      <span className="text-slate-500">{formatDate(r.changedAt)}</span>
                    </div>
                    {r.type !== "no-call" && (
                      <p className="mt-1.5 text-slate-500">
                        {formatDate(r.previousDueDate)} → {formatDate(r.newDueDate)}
                      </p>
                    )}
                    {(r.collectedAmount > 0 || r.remark) && (
                      <div className="mt-1.5 space-y-0.5 border-t border-slate-100 pt-1.5">
                        {r.collectedAmount > 0 && (
                          <p className="font-semibold text-emerald-700">
                            ₹{Number(r.collectedAmount).toLocaleString("en-IN")} collected
                          </p>
                        )}
                        {r.remark && <p className="italic text-slate-500">{r.remark}</p>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}