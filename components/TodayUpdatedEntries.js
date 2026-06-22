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

function isWithinDays(date, days) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);
  return d >= cutoff;
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

function getDayLabel(date) {
  if (!date) return "";
  if (isToday(date)) return "Today";
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

// Determine the activity type and its timestamp for a pending entry
function getPendingActivity(entry) {
  const followUpTime = entry.lastFollowUpAt ? new Date(entry.lastFollowUpAt) : null;
  const editTime = entry.lastEditedAt ? new Date(entry.lastEditedAt) : null;
  const addedTime = entry.createdAt ? new Date(entry.createdAt) : null;

  // Pick the most recent activity
  const times = [
    followUpTime && { type: "follow-up", time: followUpTime },
    editTime && { type: "edited", time: editTime },
    addedTime && isToday(addedTime) && { type: "added", time: addedTime },
  ].filter(Boolean);

  if (!times.length) return null;
  return times.reduce((a, b) => (a.time >= b.time ? a : b));
}

const TYPE_META = {
  "added":      { label: "➕ New entry added",          bg: "bg-blue-50",    text: "text-blue-700"    },
  "edited":     { label: "✏️ Details edited",           bg: "bg-amber-50",   text: "text-amber-700"   },
  "follow-up":  { label: "📞 Follow-up rescheduled",    bg: "bg-violet-50",  text: "text-violet-700"  },
  "collected":  { label: "✅ Payment collected",         bg: "bg-emerald-50", text: "text-emerald-700" },
};

export default function TodayUpdatedEntries() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch both pending entries and completed entries in parallel
      const [pendingRes, completedRes] = await Promise.all([
        fetch("/api/due-payments"),
        fetch("/api/due-payments/completed"),
      ]);

      const [pendingData, completedData] = await Promise.all([
        pendingRes.json(),
        completedRes.json(),
      ]);

      const list = [];

      // ── Pending entries: edits, follow-ups, new adds (last 4 days) ──
      if (pendingData.success) {
        for (const entry of pendingData.data) {
          const activity = getPendingActivity(entry);
          if (!activity) continue;
          if (!isWithinDays(activity.time, 4)) continue;

          list.push({
            _id: entry._id + "_" + activity.type,
            entryId: entry._id,
            customerName: entry.customerName,
            amount: entry.amount,
            type: activity.type,
            time: activity.time,
            // for follow-up
            previousDueDate: entry.previousDueDate,
            updatedDueDate: entry.updatedDueDate,
            dueDate: entry.dueDate,
            note: entry.note,
          });
        }
      }

      // ── Completed entries: collections (last 4 days) ──
      if (completedData.success) {
        for (const entry of completedData.data) {
          if (!entry.completedAt || !isWithinDays(entry.completedAt, 4)) continue;

          list.push({
            _id: entry._id + "_collected",
            entryId: entry._id,
            customerName: entry.customerName,
            amount: entry.originalAmount || entry.amount,
            type: "collected",
            time: new Date(entry.completedAt),
            amountGiven: entry.amountGiven,
            paymentMethod: entry.paymentMethod,
            accountStatus: entry.accountStatus,
            remainingAmount: entry.remainingAmount,
          });
        }
      }

      // Sort: most recent first
      list.sort((a, b) => b.time - a.time);
      setActivities(list);
    } catch (err) {
      setError("Something went wrong while loading updates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered =
    filter === "all"
      ? activities
      : activities.filter((a) => a.type === filter);

  const todayCount = activities.filter((a) => isToday(a.time)).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Today's Updates</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All activity — edits, follow-ups, new entries, collections (last 4 days)
          </p>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
          {todayCount} today
        </span>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-slate-100">
        {[
          { value: "all",       label: "All" },
          { value: "collected", label: "✅ Collected" },
          { value: "edited",    label: "✏️ Edited" },
          { value: "follow-up", label: "📞 Follow-up" },
          { value: "added",     label: "➕ New Added" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition border ${
              filter === f.value
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Activity</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Details</th>
              <th className="px-5 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  Loading updates...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No activity in the last 4 days.
                </td>
              </tr>
            ) : (
              filtered.map((a) => {
                const meta = TYPE_META[a.type] || TYPE_META["edited"];
                return (
                  <tr key={a._id} className="hover:bg-slate-50">
                    {/* Name */}
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {a.customerName}
                    </td>

                    {/* Activity badge */}
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3 text-slate-700">
                      {a.type === "collected" ? (
                        <span>
                          <span className="font-semibold text-emerald-700">
                            ₹{Number(a.amountGiven).toLocaleString("en-IN")}
                          </span>
                          {a.amount !== a.amountGiven && (
                            <span className="text-slate-400 text-xs ml-1">
                              / ₹{Number(a.amount).toLocaleString("en-IN")}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>₹{Number(a.amount).toLocaleString("en-IN")}</span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="px-5 py-3 text-slate-600 text-xs max-w-[220px]">
                      {a.type === "collected" && (
                        <span className="space-y-0.5 block">
                          <span className="block">
                            {a.paymentMethod === "cash" ? "💵 Cash" : "🏦 Check"}
                          </span>
                          {a.accountStatus === "closed" ? (
                            <span className="text-emerald-600 font-medium">Account closed</span>
                          ) : (
                            <span className="text-amber-600 font-medium">
                              ₹{Number(a.remainingAmount).toLocaleString("en-IN")} still pending
                            </span>
                          )}
                        </span>
                      )}
                      {a.type === "follow-up" && (
                        <span className="space-y-0.5 block">
                          <span className="block text-slate-400 line-through">{formatDate(a.previousDueDate)}</span>
                          <span className="block text-slate-700">→ {formatDate(a.updatedDueDate)}</span>
                        </span>
                      )}
                      {a.type === "edited" && (
                        <span className="text-slate-500">Fields updated</span>
                      )}
                      {a.type === "added" && (
                        <span className="text-slate-500">Due: {formatDate(a.dueDate)}</span>
                      )}
                    </td>

                    {/* When */}
                    <td className="px-5 py-3 text-xs">
                      <span className={`font-medium ${isToday(a.time) ? "text-sky-600" : "text-slate-600"}`}>
                        {getDayLabel(a.time)}
                      </span>
                      <span className="block text-slate-400">{formatTime(a.time)}</span>
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