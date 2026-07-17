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

// Formats an amount by truncating to an integer and inserting a decimal
// point after the first digit, e.g. 12345 -> "1.2345"
function formatAmount(value) {
  const s = String(Math.trunc(Number(value)));
  return s.length <= 1 ? s : s[0] + "." + s.slice(1);
}

// Used when the user picks an explicit From/To range.
// `from` / `to` are "YYYY-MM-DD" strings from <input type="date">.
function isWithinRange(date, from, to) {
  if (!date) return false;
  const d = new Date(date);
  if (from) {
    const fromD = new Date(from);
    fromD.setHours(0, 0, 0, 0);
    if (d < fromD) return false;
  }
  if (to) {
    const toD = new Date(to);
    toD.setHours(23, 59, 59, 999);
    if (d > toD) return false;
  }
  return true;
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
  if (diffDays > 1) return `${diffDays} days ago`;
  return formatDate(date);
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
    addedTime && { type: "added", time: addedTime },
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

// Human-friendly labels for raw schema field names shown in the change log.
const FIELD_LABELS = {
  customerName: "Name",
  amount: "Amount",
  dueDate: "Due Date",
  note: "Note",
  mobile: "Mobile",
  mobile2: "Mobile 2",
  referencedBy: "Referenced By",
};

const DATE_FIELDS = new Set(["dueDate"]);
const AMOUNT_FIELDS = new Set(["amount"]);

function formatChangeValue(field, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (DATE_FIELDS.has(field)) return formatDate(value);
  if (AMOUNT_FIELDS.has(field)) return `₹${formatAmount(value)}`;
  return String(value);
}

export default function TodayUpdatedEntries() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  // ── Date range filter ──
  // Empty strings = no range chosen, so we show everything (all-time) by
  // default instead of only the last few days.
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

      // ── Pending entries: edits, follow-ups, new adds ──
      if (pendingData.success) {
        for (const entry of pendingData.data) {
          const activity = getPendingActivity(entry);
          if (!activity) continue;

          // For "edited" activity, pull the exact field-level changes that
          // happened at this timestamp so we can show old → new detail
          // instead of a generic "Fields updated" line.
          let changes = [];
          if (activity.type === "edited" && Array.isArray(entry.editHistory)) {
            const activityTime = activity.time.getTime();
            changes = entry.editHistory
              .filter((h) => new Date(h.changedAt).getTime() === activityTime)
              .map((h) => ({
                field: h.field,
                label: FIELD_LABELS[h.field] || h.field,
                oldValue: formatChangeValue(h.field, h.oldValue),
                newValue: formatChangeValue(h.field, h.newValue),
              }));
          }

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
            changes,
          });
        }
      }

      // ── Completed entries: collections ──
      if (completedData.success) {
        for (const entry of completedData.data) {
          if (!entry.completedAt) continue;

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

  const hasCustomRange = Boolean(dateFrom || dateTo);

  const filtered = activities.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    if (hasCustomRange) return isWithinRange(a.time, dateFrom, dateTo);
    return true; // default: show all-time activity
  });

  const todayCount = activities.filter((a) => isToday(a.time)).length;

  const clearRange = () => {
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">All Updates</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every change — edits, follow-ups, new entries, collections
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

      {/* Date range picker — optional narrowing, everything shows by default */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-slate-100">
        <label className="text-xs text-slate-500">From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <label className="text-xs text-slate-500">To</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        {hasCustomRange && (
          <button
            onClick={clearRange}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
          >
            Clear ✕
          </button>
        )}
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
                  No activity {hasCustomRange ? "in the selected range" : "yet"}.
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
                            {formatAmount(a.amountGiven)}
                          </span>
                          {a.amount !== a.amountGiven && (
                            <span className="text-slate-400 text-xs ml-1">
                              / {formatAmount(a.amount)}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>{formatAmount(a.amount)}</span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="px-5 py-3 text-slate-600 text-xs max-w-[260px]">
                      {a.type === "collected" && (
                        <span className="space-y-0.5 block">
                          <span className="block">
                            {a.paymentMethod === "cash" ? "💵 Cash" : "🏦 Check"}
                          </span>
                          {a.accountStatus === "closed" ? (
                            <span className="text-emerald-600 font-medium">Account closed</span>
                          ) : (
                            <span className="text-amber-600 font-medium">
                              {formatAmount(a.remainingAmount)} still pending
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
                        a.changes && a.changes.length > 0 ? (
                          <span className="block space-y-1">
                            {a.changes.map((c, i) => (
                              <span key={i} className="block">
                                <span className="font-medium text-slate-700">{c.label}:</span>{" "}
                                <span className="text-slate-400 line-through">{c.oldValue}</span>{" "}
                                <span className="text-slate-700">→ {c.newValue}</span>
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-slate-500">Fields updated</span>
                        )
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