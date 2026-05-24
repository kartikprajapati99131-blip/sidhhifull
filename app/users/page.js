"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const ROLES = ["admin", "user", "staff", "mistry", "architect"];

const ROLE_STYLES = {
  admin:     "bg-violet-100 text-violet-700 border-violet-200",
  user:      "bg-sky-100 text-sky-700 border-sky-200",
  staff:     "bg-emerald-100 text-emerald-700 border-emerald-200",
  mistry:    "bg-amber-100 text-amber-700 border-amber-200",
  architect: "bg-rose-100 text-rose-700 border-rose-200",
};

function Avatar({ name }) {
  const initials = name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";
  const colors = ["bg-violet-500","bg-sky-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-indigo-500"];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── POINTS MODAL ───────────────────────────────────────────────────────────
function PointsModal({ user, onClose, onSuccess }) {
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const amt = parseInt(points);
    if (!amt || amt === 0) { setError("Enter a valid number (e.g. 10 or -5)"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/user/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: amt, reason: reason.trim() || "Points added by admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onSuccess(user._id, amt);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update points");
    } finally {
      setLoading(false);
    }
  };

  // close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">Manage Points</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {user.name} ·{" "}
              <span className="font-bold text-amber-500">{user.points || 0} pts</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Quick presets */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick Add</p>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 25, 50, -5, -10].map((p) => (
                <button
                  key={p}
                  onClick={() => setPoints(String(p))}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    points === String(p)
                      ? "bg-gray-900 text-white border-gray-900"
                      : p > 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  {p > 0 ? `+${p}` : p}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Custom Amount <span className="text-gray-400 normal-case font-normal">(negative to deduct)</span>
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="e.g. 10 or -5"
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Reason <span className="text-gray-300 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Great performance this week"
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              ⚠ {error}
            </p>
          )}

          {/* Preview */}
          {points && !isNaN(parseInt(points)) && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">New total</span>
              <span className="text-sm font-black text-gray-900">
                {(user.points || 0) + parseInt(points)} pts
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading || !points}
              className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [pointsUser, setPointsUser] = useState(null); // user for modal

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/user/get");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ✅ Your existing changeRole — untouched
  const changeRole = async (id, role) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/user/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { alert("Failed to update role"); return; }
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role } : u)));
    } catch {
      console.error("Error updating role");
    } finally {
      setUpdating(null);
    }
  };

  // optimistic points update — no re-fetch needed
  const handlePointsSuccess = (userId, amount) => {
    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId ? { ...u, points: (u.points || 0) + amount } : u
      )
    );
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">
            {users.length} total members · {filtered.length} shown
          </p>
        </div>

        {/* SEARCH + FILTER BAR */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-0.5 sm:pb-0">
            <button
              onClick={() => setFilterRole("all")}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${filterRole === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}
            >
              All
            </button>
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${filterRole === r ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* USER LIST */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm">No users match your search.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Desktop Header — 6 cols now */}
            <div className="hidden sm:grid grid-cols-[2fr_2fr_1fr_0.8fr_1.5fr_1fr] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Points</span>
              <span>Change Role</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-gray-50">
              {filtered.map((user) => (
                <div
                  key={user._id}
                  className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1fr_0.8fr_1.5fr_1fr] gap-3 sm:gap-4 px-5 py-4 items-center hover:bg-gray-50/60 transition-colors"
                >
                  {/* Name + Avatar */}
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} />
                    <span className="text-sm font-semibold text-gray-900 truncate">{user.name || "—"}</span>
                  </div>

                  {/* Email */}
                  <span className="text-sm text-gray-500 truncate pl-12 sm:pl-0">{user.email}</span>

                  {/* Role Badge */}
                  <div className="pl-12 sm:pl-0">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${ROLE_STYLES[user.role] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {user.role}
                    </span>
                  </div>

                  {/* Points */}
                  <div className="pl-12 sm:pl-0">
                    <span className="text-sm font-black text-amber-500">{user.points || 0}</span>
                    <span className="text-xs text-gray-400 ml-1">pts</span>
                  </div>

                  {/* Role Selector — ✅ your existing logic untouched */}
                  <div className="pl-12 sm:pl-0 flex items-center gap-2">
                    <select
                      value={user.role}
                      disabled={updating === user._id}
                      onChange={(e) => changeRole(user._id, e.target.value)}
                      className="text-sm bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="capitalize">{r}</option>
                      ))}
                    </select>
                    {updating === user._id && (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                  </div>

                  {/* Actions — NEW */}
                  <div className="pl-12 sm:pl-0 flex items-center gap-2">
                    <button
                      onClick={() => setPointsUser(user)}
                      title="Manage points"
                      className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition font-semibold whitespace-nowrap"
                    >
                      ⭐ Pts
                    </button>
                    <Link
                      href={`/profile/${user._id}`}
                      className="text-xs bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-200 transition font-semibold"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* POINTS MODAL */}
      {pointsUser && (
        <PointsModal
          user={pointsUser}
          onClose={() => setPointsUser(null)}
          onSuccess={handlePointsSuccess}
        />
      )}
    </div>
  );
}