"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CompensationModal from "./_components/CompensationModal";
import { AVATAR_COLORS, getInitials, firstDayOfMonth, todayStr, formatHM } from "./_components/helpers";

const MANAGER_ROLES = ["admin", "subadmin"];

export default function CompensationOverview() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isManager = MANAGER_ROLES.includes(role);
  const router = useRouter();

  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(todayStr());
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/compensation/summary?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((res) => setData(res.data || []))
      .finally(() => setLoading(false));
  };

  // Employee list for the "+ Add Compensation" dropdown — same source the
  // original compensation admin page used.
  const loadEmployees = () => {
    fetch("/api/attendance/get")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const map = {};
        list.forEach((rec) => {
          if (rec.userId && rec.userName && !map[rec.userId]) {
            map[rec.userId] = { userId: rec.userId, userName: rec.userName };
          }
        });
        setEmployees(Object.values(map));
      });
  };

  useEffect(() => {
    load();
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const entries = data.filter((e) => (e.name || "").toLowerCase().includes(search.toLowerCase()));
  const grandTotalMinutes = entries.reduce(
    (s, e) => s + (e.totalHM.hours * 60 + e.totalHM.minutes),
    0
  );

  const handleSaved = () => {
    setToast({ type: "success", message: "Compensation Added Successfully" });
    load();
  };

  if (session && !isManager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center text-gray-400">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-sm">You don&apos;t have access to this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Compensation Hours</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manually grant compensation hours for trips, visits, overtime and more</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs font-medium bg-gray-900 text-white px-3 py-1.5 rounded-full hover:bg-gray-800"
        >
          + Add Compensation
        </button>
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


     

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-5 shadow-sm">
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
            ×
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {entries.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400 text-sm">No employees found.</div>
          ) : (
            entries.map((emp, i) => {
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div
                  key={emp.userId}
                  onClick={() => router.push(`/compensation/${emp.userId}?from=${from}&to=${to}`)}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-gray-300 transition-all shadow-sm cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 border"
                    style={{ background: color.bg, color: color.text, borderColor: color.border }}
                  >
                    {getInitials(emp.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-400">
                      {emp.recordsCount} entr{emp.recordsCount !== 1 ? "ies" : "y"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-emerald-700">
                      {formatHM(emp.totalHM.hours, emp.totalHM.minutes)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showAdd && (
        <CompensationModal
          employees={employees}
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
