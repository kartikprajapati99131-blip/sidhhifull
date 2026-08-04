"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import CompensationModal from "../_components/CompensationModal";
import { todayStr, formatHM, formatDateLabel, formatMonthLabel } from "../_components/helpers";

export default function EmployeeCompensationPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(
    searchParams.get("from") ||
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`
  );
  const [to, setTo] = useState(searchParams.get("to") || todayStr());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openMonths, setOpenMonths] = useState({});
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/compensation/summary?userId=${id}&from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((res) => {
        const emp = (res.data || [])[0] || null;
        setSummary(emp);
        if (emp) {
          const months = {};
          emp.records.forEach((r) => {
            months[r.date.slice(0, 7)] = true;
          });
          const latest = Object.keys(months).sort().reverse()[0];
          if (latest) setOpenMonths({ [latest]: true });
        }
      })
      .finally(() => setLoading(false));
  }, [id, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleMonth = (key) => setOpenMonths((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSaved = (record, wasEdit) => {
    setToast({
      type: "success",
      message: wasEdit ? "Compensation Updated Successfully" : "Compensation Added Successfully",
    });
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/compensation/${deleteTarget._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", message: data.error || "Something went wrong." });
        return;
      }
      setToast({ type: "success", message: "Compensation Deleted Successfully" });
      load();
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading && !summary) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Loading...</div>;
  }
  if (!summary) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Employee not found.</div>;
  }

  const recordsByMonth = {};
  summary.records.forEach((r) => {
    const key = r.date.slice(0, 7);
    if (!recordsByMonth[key]) recordsByMonth[key] = [];
    recordsByMonth[key].push(r);
  });
  const monthKeys = Object.keys(recordsByMonth).sort().reverse();

  const fixedEmployee = { userId: summary.userId, userName: summary.name };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{summary.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{summary.role} · {from} to {to}</p>
        </div>

        {toast && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2.5 border ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                : "bg-rose-50 border-rose-100 text-rose-700"
            }`}
          >
            <span className="text-base mt-0.5">{toast.type === "success" ? "✓" : "⚠"}</span>
            <span>{toast.message}</span>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <button onClick={load} className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
            Apply
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">Compensation summary</p>
          <div className="grid grid-cols-2 gap-3 text-sm mb-2">
            <div>
              <p className="text-xs text-gray-400">Total entries</p>
              <p className="text-gray-800">{summary.recordsCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Last entry</p>
              <p className="text-gray-800">{formatDateLabel(summary.lastDate)}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total compensation</span>
            <span className="text-xl font-black text-emerald-700">
              {formatHM(summary.totalHM.hours, summary.totalHM.minutes)}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="w-full mb-4 text-sm font-medium text-white bg-gray-900 rounded-xl py-3 hover:bg-gray-800"
        >
          + Add Compensation
        </button>

        <div className="flex flex-col gap-3">
          {monthKeys.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm bg-white border border-gray-100 rounded-2xl">
              No compensation records yet.
            </div>
          )}
          {monthKeys.map((monthKey) => {
            const isOpen = !!openMonths[monthKey];
            const recs = recordsByMonth[monthKey];
            const monthMinutes = recs.reduce((s, r) => s + (r.hours || 0) * 60 + (r.minutes || 0), 0);

            return (
              <div key={monthKey} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleMonth(monthKey)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{formatMonthLabel(monthKey)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{recs.length} entr{recs.length !== 1 ? "ies" : "y"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatHM(Math.floor(monthMinutes / 60), monthMinutes % 60)}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {recs.map((r) => (
                      <div key={r._id} className="px-5 py-3 flex items-center justify-between group">
                        <div>
                          <p className="text-sm text-gray-800">{formatDateLabel(r.date)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {r.reason} · Added by {r.addedByName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-emerald-600">
                            {formatHM(r.hours, r.minutes)}
                          </span>
                          <button
                            onClick={() => setEditTarget(r)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-600 text-xs px-1"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 text-sm px-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showAdd && (
        <CompensationModal fixedEmployee={fixedEmployee} onClose={() => setShowAdd(false)} onSaved={handleSaved} />
      )}
      {editTarget && (
        <CompensationModal
          initial={editTarget}
          fixedEmployee={fixedEmployee}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Compensation</h3>
            <p className="text-xs text-gray-500 mb-4">
              Remove this {formatHM(deleteTarget.hours, deleteTarget.minutes)} entry for{" "}
              {formatDateLabel(deleteTarget.date)}? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 text-sm font-medium text-white bg-rose-600 rounded-lg py-2 hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
