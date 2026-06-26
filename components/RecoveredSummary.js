"use client";

import { useState, useEffect, useCallback } from "react";

const ADMIN_USER = "Kartik";
const ADMIN_PASS = "PK";

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

// ── Password gate ──────────────────────────────────────────────
function PasswordGate({ onUnlock }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const attempt = () => {
    if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) {
      onUnlock();
    } else {
      setErr("Incorrect username or password.");
      setPass("");
    }
  };

  return (
    <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">Restricted Section</div>
            <div className="text-xs text-slate-400">Amount Recovered is access-controlled</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Username
            </label>
            <input
              type="text"
              value={user}
              onChange={(e) => { setUser(e.target.value); setErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && attempt()}
              placeholder="Username"
              autoComplete="username"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${
                err ? "border-red-400" : "border-slate-300"
              }`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Password
            </label>
            <input
              type="password"
              value={pass}
              onChange={(e) => { setPass(e.target.value); setErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && attempt()}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${
                err ? "border-red-400" : "border-slate-300"
              }`}
            />
          </div>

          {err && <div className="text-xs font-medium text-red-600">{err}</div>}

          <button
            onClick={attempt}
            className="mt-1 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecoveredSummary() {
  const [unlocked, setUnlocked] = useState(false);

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
    if (unlocked) fetchCompleted();
  }, [unlocked, fetchCompleted]);

  // Show gate until unlocked
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

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

      {/* Summary cards — stack on mobile, 3-col on sm+ */}
      {!loading && !error && (
        <div className="grid grid-cols-1 divide-y divide-slate-200 border-b border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
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