"use client";

import { useState, useEffect, useCallback } from "react";

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysSince(date) {
  if (!date) return "-";
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
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

export default function NoAnswerList() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [rescheduleEntry, setRescheduleEntry] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

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

  const openReschedule = (entry) => { setRescheduleEntry(entry); setRescheduleDate(""); };
  const closeReschedule = () => { setRescheduleEntry(null); setRescheduleDate(""); };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) { showToast("Pick a new due date", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/due-payments/${rescheduleEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnsiteReschedule: true, dueDate: rescheduleDate }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Rescheduled — back in the active list");
        setEntries((prev) => prev.filter((e) => e._id !== rescheduleEntry._id));
        closeReschedule();
      } else {
        showToast(data.message || "Failed to reschedule", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <Toast toast={toast} />
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">No Answer (7+ days overdue)</h2>
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">{entries.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">AMT</th>
              <th className="px-5 py-3">Mobile</th>
              <th className="px-5 py-3">Due Date</th>
              <th className="px-5 py-3">Days Overdue</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">No stale entries.</td></tr>
            ) : entries.map((entry) => (
              <tr key={entry._id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{entry.customerName}</td>
                <td className="px-5 py-3 text-slate-700">
                  {(() => { const s = String(Math.trunc(Number(entry.amount))); return s.length <= 1 ? s : s[0] + "." + s.slice(1); })()}
                </td>
                <td className="px-5 py-3 text-slate-700">
                  {entry.mobile ? (
                    <a href={`tel:${entry.mobile}`} className="text-sky-600 hover:text-sky-800 hover:underline transition">
                      +91 {entry.mobile}
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-700">{formatDate(entry.dueDate)}</td>
                <td className="px-5 py-3 text-red-600 font-medium">
                  {daysSince(entry.dueDate)} days
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => openReschedule(entry)}
                    className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                    Reschedule
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rescheduleEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-1 text-base font-semibold text-slate-800">Reschedule</h3>
            <p className="mb-4 text-sm text-slate-600">{rescheduleEntry.customerName}</p>
            <form onSubmit={handleReschedule} className="space-y-3">
              <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeReschedule}
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
    </div>
  );
}