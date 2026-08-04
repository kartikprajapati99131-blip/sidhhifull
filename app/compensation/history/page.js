"use client";

import { useEffect, useState } from "react";

function formatHM(hours = 0, minutes = 0) {
  return `+${hours}h ${minutes}m`;
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CompensationHistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No employeeId param — the API always scopes non-managers to their own records.
    fetch("/api/compensation")
      .then((res) => res.json())
      .then((data) => setRecords(data.records || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Compensation History</h1>
          <p className="text-sm text-gray-400 mt-1">All compensation hours added by admin</p>
        </div>

        {loading && <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>}

        {!loading && records.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">No compensation records yet.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {records.map((rec) => (
            <div
              key={rec._id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">{formatDateLabel(rec.date)}</span>
                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                  {formatHM(rec.hours, rec.minutes)}
                </span>
              </div>

              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Reason</p>
              <p className="text-sm font-medium text-gray-900 mb-2">{rec.reason}</p>

              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Added By</p>
              <p className="text-sm text-gray-700">{rec.addedByName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
