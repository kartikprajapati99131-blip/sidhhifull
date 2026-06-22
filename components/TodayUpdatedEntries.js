"use client";

import { useState, useEffect, useCallback } from "react";

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

function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function TodayUpdatedEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUpdatedToday = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Reuses the pending-payments list and filters client-side for
      // entries that were rescheduled ("Done Calling") today.
      const res = await fetch("/api/due-payments");
      const data = await res.json();

      if (data.success) {
        const updatedToday = data.data.filter(
          (entry) => entry.lastFollowUpAt && isToday(entry.lastFollowUpAt)
        );
        setEntries(updatedToday);
      } else {
        setError(data.message || "Failed to load follow up updates");
      }
    } catch (err) {
      setError("Something went wrong while loading follow up updates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdatedToday();
  }, [fetchUpdatedToday]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">
          Today&apos;s Updated Follow Ups
        </h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {entries.length} rescheduled today
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Old Due Date</th>
              <th className="px-5 py-3">New Due Date</th>
              <th className="px-5 py-3">Updated Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  Loading follow up updates...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No follow ups have been rescheduled today.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry._id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {entry.customerName}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    ₹{Number(entry.amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {formatDate(entry.previousDueDate)}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {formatDate(entry.updatedDueDate)}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {formatTime(entry.lastFollowUpAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}