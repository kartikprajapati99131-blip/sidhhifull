"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import DuePaymentManager  from "@/components/DuePaymentManager";
import DueReminderPopup   from "@/components/DueReminderPopup";
import TodayUpdatedEntries from "@/components/TodayUpdatedEntries";
import RecoveredPayments  from "@/components/RecoveredSummary";

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <p className="text-8xl font-black text-slate-200 select-none leading-none">404</p>
        <p className="text-5xl mt-2 mb-4">🚫</p>
        <h2 className="font-bold text-slate-800 text-xl mb-2">Page Not Found</h2>
        <p className="text-slate-500 text-sm">You don't have permission to view this page.</p>
      </div>
    </div>
  );
}

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-sky-500" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const TABS = {
  admin: [
    { key: "due",       label: "💳 All Reminders" },
    { key: "today",     label: "📋 Today's Updates" },
    { key: "recovered", label: "✅ Recovered" },
    { key: "reminder",  label: "🔔 Today's Reminders" },
  ],
  collection: [
    { key: "due",       label: "💳 All Reminders" },
    { key: "reminder",  label: "🔔 Reminders" },
  ],
};

export default function DuePaymentsPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState("due");

  const role    = session?.user?.role;
  const isAdmin = role === "admin";

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={36} />
          <p className="text-slate-500 text-sm font-medium">Loading your session…</p>
        </div>
      </div>
    );
  }

  if (!session || (role !== "admin" && role !== "collection")) return <NotFoundPage />;

  const tabs = TABS[role] || TABS.collection;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Due Reminders</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {isAdmin ? "Admin" : "Collection"} · {session?.user?.name || session?.user?.email}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            isAdmin
              ? "bg-sky-50 text-sky-600 border-sky-200"
              : "bg-violet-50 text-violet-600 border-violet-200"
          }`}>
            {isAdmin ? "Admin" : "Collection"}
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition -mb-px whitespace-nowrap ${
                tab === t.key
                  ? "border-sky-500 text-sky-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {tab === "due"       && <DuePaymentManager />}
        {tab === "today"     && <TodayUpdatedEntries />}
        {tab === "recovered" && <RecoveredPayments />}
        {tab === "reminder"  && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Due Reminders
            </h3>
            <p className="text-slate-400 text-sm mb-5">
              Overdue and today's pending payments — same as the auto-popup shown on page load.
            </p>
            <DueReminderPopup inlineMode />
          </div>
        )}
      </div>

      {/* Auto-popup still fires on load for overdue/today's entries */}
      <DueReminderPopup />
    </div>
  );
}