"use client";

import { useState, useEffect, useCallback } from "react";

const FILTERS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date) {
  if (!date) return "-";
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isInRange(date, filter) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();

  if (filter === "today") {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }
  if (filter === "week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  }
  if (filter === "month") {
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }
  return true; // all time
}

export default function RecoveredSummary() {
  const [allCompleted, setAllCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("today");

  const fetchCompleted = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/due-payments/completed");
      const data = await res.json();
      if (data.success) {
        setAllCompleted(data.data);
      } else {
        setError(data.message || "Failed to load completed payments");
      }
    } catch {
      setError("Something went wrong while loading completed payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompleted();
  }, [fetchCompleted]);

  const filtered = allCompleted.filter((e) =>
    isInRange(e.completedAt, filter)
  );

  const totalRecovered = filtered.reduce(
    (sum, e) => sum + (Number(e.amountGiven) || 0),
    0
  );
  const cashTotal = filtered
    .filter((e) => e.paymentMethod === "cash")
    .reduce((sum, e) => sum + (Number(e.amountGiven) || 0), 0);
  const checkTotal = filtered
    .filter((e) => e.paymentMethod === "check")
    .reduce((sum, e) => sum + (Number(e.amountGiven) || 0), 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">
          Amount Recovered
        </h2>
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                filter === f.value
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {!loading && !error && (
        <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200">
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Recovered
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              ₹{totalRecovered.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {filtered.length} payment{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              💵 Cash
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-700">
              ₹{cashTotal.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              🏦 Check
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-700">
              ₹{checkTotal.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Total Due</th>
              <th className="px-5 py-3">Collected</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Completed On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  Loading recovered payments...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  No completed payments for this period.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const isClosed = entry.accountStatus === "closed";
                const amountGiven = Number(entry.amountGiven) || 0;
                const originalAmount = Number(entry.originalAmount || entry.amount) || 0;
                return (
                  <tr key={entry._id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {entry.customerName}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      ₹{originalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 font-semibold text-emerald-700">
                      ₹{amountGiven.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 text-slate-700 capitalize">
                      {entry.paymentMethod === "cash" ? "💵 Cash" : "🏦 Check"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          isClosed
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isClosed ? "✅ Closed" : "🔄 Continued"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {formatDate(entry.completedAt)}
                      <br />
                      {formatTime(entry.completedAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
