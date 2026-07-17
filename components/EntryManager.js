"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";

const CAN_SEE_ALL_ROLES = ["admin", "sales"];

// Date-range filter: admin + subadmin.
const STATS_ROLES = ["admin", "subadmin"];

// Customer success-ratio panel (reveals per-staff conversion rates) — admin only.
const SUCCESS_RATIO_ROLES = ["admin"];

const EMPTY_FORM = {
  mobile1: "",
  mobile2: "",
  name: "",
  siteAddress: "",
  permanentAddress: "",
  profession: "",
  mistryName: "",
  mistryNumber: "",
  architectName: "",
  architectNumber: "",
  nextMeetingDate: "",
  remark: "",
};

const CUSTOMER_FIELDS = [
  { name: "mobile1", label: "Mobile No 1", type: "tel", required: true, half: true },
  { name: "mobile2", label: "Mobile No 2", type: "tel", half: true },
  { name: "name", label: "Customer Name", required: true, half: true },
  { name: "profession", label: "Profession", half: true },
  { name: "siteAddress", label: "Site Address", textarea: true },
  { name: "permanentAddress", label: "Permanent Address", textarea: true },
  { name: "mistryName", label: "Mistry Name", half: true },
  { name: "mistryNumber", label: "Mistry Number", type: "tel", half: true },
  { name: "architectName", label: "Architect Name", half: true },
  { name: "architectNumber", label: "Architect Number", type: "tel", half: true },
];

const MISTRY_FIELDS = [
  { name: "mobile1", label: "Mobile No 1", type: "tel", required: true, half: true },
  { name: "mobile2", label: "Mobile No 2", type: "tel", half: true },
  { name: "name", label: "Mistry Name", required: true, half: true },
];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  "site-confirmed": "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

const ACTION_TITLES = {
  cancel: "Why is this being cancelled?",
  call: "Log a call",
  onsite: "Log on-site visit",
  "site-confirm": "Confirm site",
};

const ACTIVITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "added", label: "➕ Added" },
  { value: "call", label: "📞 Call" },
  { value: "onsite", label: "🏗️ On-site" },
  { value: "site-confirm", label: "✅ Confirmed" },
  { value: "cancel", label: "❌ Cancelled" },
  { value: "edit", label: "✏️ Edited" },
];

// "Today's Updates" — every add / call / on-site / confirm / cancel / edit
// across all entries currently visible to this user, newest first, with
// Today/Yesterday/N-days-ago labels and an optional date range.
function ActivityLogView({ entries, onBack, onOpenDetail }) {
  const [filter, setFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const feed = useMemo(() => buildActivityFeed(entries), [entries]);
  const hasCustomRange = Boolean(dateFrom || dateTo);

  const filtered = feed.filter((a) => {
    if (filter !== "all" && a.activity !== filter) return false;
    if (hasCustomRange) return isWithinRange(a.time, dateFrom, dateTo);
    return true;
  });

  const todayCount = feed.filter((a) => isToday(a.time)).length;
  const clearRange = () => { setDateFrom(""); setDateTo(""); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">Back to entries</span>
        </button>
        <h2 className="text-base font-semibold text-slate-800">Today&apos;s Updates</h2>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">All Updates</h3>
            <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">Every remark — new entries, calls, on-site visits, confirmations, cancellations, edits</p>
          </div>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">{todayCount} today</span>
        </div>

        {/* Mobile: one compact row — activity dropdown + a Date toggle — instead of pills and an open date range */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 sm:hidden">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {ACTIVITY_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${hasCustomRange ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white text-slate-600"}`}
          >
            Date{hasCustomRange ? " •" : ""}
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 sm:hidden">
            <label className="text-xs text-slate-500">From</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <label className="text-xs text-slate-500">To</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {hasCustomRange && (
              <button onClick={clearRange} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
                Clear ✕
              </button>
            )}
          </div>
        )}

        {/* Desktop: pills + always-visible date range */}
        <div className="hidden flex-wrap gap-2 border-b border-slate-100 px-5 py-3 sm:flex">
          {ACTIVITY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filter === f.value ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="hidden flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 sm:flex">
          <label className="text-xs text-slate-500">From</label>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <label className="text-xs text-slate-500">To</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {hasCustomRange && (
            <button onClick={clearRange} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
              Clear ✕
            </button>
          )}
        </div>

        {/* Cards — small screens */}
        <div className="grid grid-cols-1 gap-2 p-4 sm:hidden">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No activity {hasCustomRange ? "in the selected range" : "yet"}.</p>
          ) : (
            filtered.map((a) => {
              const meta = ACTIVITY_META[a.activity] || ACTIVITY_META.edit;
              return (
                <button
                  key={a.id}
                  onClick={() => onOpenDetail(a.entry.id)}
                  className="rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{a.entry.name}</span>
                    <span className={`font-medium text-xs ${isToday(a.time) ? "text-sky-600" : "text-slate-500"}`}>{getDayLabel(a.time)}</span>
                  </div>
                  <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.text}`}>{meta.label}</span>
                  {a.text && <p className="mt-1 text-xs text-slate-600">{a.text}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">{a.by?.name} · {formatTimeOnly(a.time)}</p>
                </button>
              );
            })
          )}
        </div>

        {/* Table — sm and up */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Activity</th>
                <th className="px-5 py-3">Remark</th>
                <th className="px-5 py-3">By</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No activity {hasCustomRange ? "in the selected range" : "yet"}.</td></tr>
              ) : (
                filtered.map((a) => {
                  const meta = ACTIVITY_META[a.activity] || ACTIVITY_META.edit;
                  return (
                    <tr key={a.id} onClick={() => onOpenDetail(a.entry.id)} className="cursor-pointer hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {a.entry.name}
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${a.entry.type === "customer" ? "bg-indigo-50 text-indigo-700" : "bg-orange-50 text-orange-700"}`}>
                          {a.entry.type === "customer" ? "Customer" : "Mistry"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.text}`}>{meta.label}</span>
                      </td>
                      <td className="max-w-[260px] px-5 py-3 text-xs text-slate-600">{a.text || <span className="text-slate-400">—</span>}</td>
                      <td className="px-5 py-3 text-xs text-slate-600">{a.by?.name}</td>
                      <td className="px-5 py-3 text-xs">
                        <span className={`font-medium ${isToday(a.time) ? "text-sky-600" : "text-slate-600"}`}>{getDayLabel(a.time)}</span>
                        <span className="block text-slate-400">{formatTimeOnly(a.time)}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const ACTION_MENU_ITEMS = [
  { action: "site-confirm", label: "Confirm site" },
  { action: "call", label: "Log call" },
  { action: "onsite", label: "Log on-site" },
  { action: "cancel", label: "Cancel", danger: true },
];

const HISTORY_LABEL = {
  note: "Note",
  call: "Called",
  onsite: "On-site Visit",
  cancel: "Cancelled",
  "site-confirm": "Site Confirmed",
  edit: "Edited",
};

const HISTORY_DOT = {
  note: "bg-slate-400",
  call: "bg-sky-500",
  onsite: "bg-violet-500",
  cancel: "bg-rose-500",
  "site-confirm": "bg-emerald-500",
  edit: "bg-amber-500",
};

const todayStr = () => new Date().toISOString().slice(0, 10);

// How many whole days past the next-meeting date we are (negative = future,
// 0 = due today). Both sides are plain "YYYY-MM-DD" strings so this is exact.
function daysOverdue(entry) {
  if (!entry.nextMeetingDate) return null;
  const ms = new Date(todayStr()) - new Date(entry.nextMeetingDate);
  return Math.floor(ms / 86400000);
}

const NOT_VISITED_AFTER_DAYS = 5;

// Due & overdue page: only entries due today, or overdue by up to 5 days.
const isDueOrOverdue = (e) => {
  if (e.status !== "pending" || !e.nextMeetingDate) return false;
  const d = daysOverdue(e);
  return d >= 0 && d <= NOT_VISITED_AFTER_DAYS;
};

// Anything overdue by more than 5 days falls off the due/overdue page and
// lands here instead — it still needs attention, just not mixed in with
// fresh follow-ups.
const isNotVisited = (e) => {
  if (e.status !== "pending" || !e.nextMeetingDate) return false;
  const d = daysOverdue(e);
  return d > NOT_VISITED_AFTER_DAYS;
};

function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function formatDayOnly(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTimeOnly(date) {
  if (!date) return "-";
  return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// "Today" / "Yesterday" / "N days ago" / plain date once it's far enough back.
function getDayLabel(date) {
  if (!date) return "";
  if (isToday(date)) return "Today";
  const diffDays = Math.floor((new Date() - new Date(date)) / 86400000);
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 6) return `${diffDays} days ago`;
  return formatDayOnly(date);
}

// "YYYY-MM-DD" or "" -> is `date` within [from, to] inclusive (either bound optional)
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

const ACTIVITY_META = {
  added: { label: "➕ New entry added", bg: "bg-blue-50", text: "text-blue-700" },
  note: { label: "📝 Note added", bg: "bg-slate-50", text: "text-slate-700" },
  call: { label: "📞 Call logged", bg: "bg-sky-50", text: "text-sky-700" },
  onsite: { label: "🏗️ On-site visit", bg: "bg-violet-50", text: "text-violet-700" },
  "site-confirm": { label: "✅ Site confirmed", bg: "bg-emerald-50", text: "text-emerald-700" },
  cancel: { label: "❌ Cancelled", bg: "bg-rose-50", text: "text-rose-700" },
  edit: { label: "✏️ Details edited", bg: "bg-amber-50", text: "text-amber-700" },
};

// Flattens every entry's creation + full history into one timestamp-sorted
// activity feed — mirrors the "All Updates" view from the payments module.
function buildActivityFeed(entries) {
  const list = [];
  for (const entry of entries) {
    if (entry.createdAt) {
      list.push({
        id: `${entry.id}_added`,
        entry,
        activity: "added",
        time: entry.createdAt,
        by: entry.createdBy,
        text: "",
      });
    }
    for (const h of entry.history || []) {
      list.push({
        id: `${entry.id}_${h.id}`,
        entry,
        activity: h.type,
        time: h.at,
        by: h.by,
        text: h.text,
      });
    }
  }
  return list.sort((a, b) => new Date(b.time) - new Date(a.time));
}

function fmtDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-5 right-5 left-5 z-[100] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all sm:left-auto ${isError ? "bg-red-600" : "bg-emerald-600"}`}
      role="status"
    >
      {toast.message}
    </div>
  );
}

function CallLink({ number, className }) {
  if (!number) return <span className="text-slate-400">—</span>;
  return (
    <a href={`tel:${number}`} onClick={(e) => e.stopPropagation()} className={className || "text-sky-600 hover:text-sky-800 hover:underline"}>
      {number}
    </a>
  );
}

function Field({ field, value, onChange }) {
  const common = {
    id: field.name,
    name: field.name,
    value: value ?? "",
    onChange: (e) => onChange(field.name, e.target.value),
    required: !!field.required,
    className:
      "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
    placeholder: field.label,
  };
  return (
    <div className={field.half ? "sm:col-span-1" : "sm:col-span-2"}>
      <label htmlFor={field.name} className="mb-1 block text-xs font-medium text-slate-600">
        {field.label}
        {field.required && <span className="text-rose-500"> *</span>}
      </label>
      {field.textarea ? <textarea rows={2} {...common} /> : <input type={field.type || "text"} {...common} />}
    </div>
  );
}

// One dropdown holding every status action (Confirm / Call / On-site / Cancel)
// plus Edit and (if allowed) Delete — replaces the old row of separate buttons.
function ActionMenu({ entry, canDelete, onAction, onEdit, onDelete, align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const disabled = entry.status === "cancelled";

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
      >
        Actions
        <svg className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className={`absolute z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${align === "right" ? "right-0" : "left-0"}`}>
          {ACTION_MENU_ITEMS.map((item) => (
            <button
              key={item.action}
              type="button"
              disabled={disabled}
              onClick={() => { setOpen(false); onAction(entry, item.action); }}
              className={`block w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${item.danger ? "text-rose-600" : "text-slate-700"}`}
            >
              {item.label}
            </button>
          ))}
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit(entry); }}
            className="block w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(entry); }}
              className="block w-full px-3 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-slate-50"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}

// Full-detail popup opened by clicking any entry — every field, plus the
// complete history timeline, laid out clearly instead of squeezed into a row.
function DetailModal({ entry, onClose }) {
  if (!entry) return null;
  const isCustomer = entry.type === "customer";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${isCustomer ? "bg-indigo-50 text-indigo-700" : "bg-orange-50 text-orange-700"}`}>
                {isCustomer ? "Customer" : "Mistry"}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[entry.status]}`}>{entry.status}</span>
              {isDueOrOverdue(entry) && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                  {entry.nextMeetingDate === todayStr() ? "Due today" : "Overdue"}
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-lg font-semibold text-slate-900">{entry.name || "—"}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">✕</button>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <DetailRow label="Mobile No 1" value={entry.mobile1 && <CallLink number={entry.mobile1} />} />
          <DetailRow label="Mobile No 2" value={entry.mobile2 && <CallLink number={entry.mobile2} />} />
          <DetailRow label="Next meeting date" value={entry.nextMeetingDate} />

          {isCustomer && (
            <>
              <DetailRow label="Profession" value={entry.profession} />
              <div className="sm:col-span-2"><DetailRow label="Site Address" value={entry.siteAddress} /></div>
              <div className="sm:col-span-2"><DetailRow label="Permanent Address" value={entry.permanentAddress} /></div>
              <DetailRow label="Mistry Name" value={entry.mistryName} />
              <DetailRow label="Mistry Number" value={entry.mistryNumber && <CallLink number={entry.mistryNumber} />} />
              <DetailRow label="Architect Name" value={entry.architectName} />
              <DetailRow label="Architect Number" value={entry.architectNumber && <CallLink number={entry.architectNumber} />} />
            </>
          )}

          <DetailRow label="Added by" value={`${entry.createdBy?.name} (${entry.createdBy?.role})`} />
          <DetailRow label="Created" value={fmtDateTime(entry.createdAt)} />
        </dl>

        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          History ({entry.history?.length || 0})
        </p>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {(!entry.history || entry.history.length === 0) ? (
            <p className="text-sm text-slate-400">No activity yet.</p>
          ) : (
            entry.history.slice().reverse().map((h) => (
              <div key={h.id} className="flex items-start gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs">
                <span className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${HISTORY_DOT[h.type]}`} />
                <div>
                  <span className="font-medium text-slate-700">{HISTORY_LABEL[h.type]}</span>
                  <span className="text-slate-400"> · {h.by?.name} ({h.by?.role}) · {fmtDateTime(h.at)}</span>
                  {h.text && <p className="mt-0.5 text-slate-600">{h.text}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// A single entry rendered as a card — used on small screens instead of a
// horizontally-scrolling table row.
function EntryCard({ entry, canDelete, onAction, onEdit, onDelete, onOpenDetail }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  return (
    <div
      onClick={() => onOpenDetail(entry)}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${entry.type === "customer" ? "bg-indigo-50 text-indigo-700" : "bg-orange-50 text-orange-700"}`}>
              {entry.type === "customer" ? "Customer" : "Mistry"}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[entry.status]}`}>{entry.status}</span>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-slate-900">{entry.name || "—"}</h3>
        </div>
        <ActionMenu entry={entry} canDelete={canDelete} onAction={onAction} onEdit={onEdit} onDelete={onDelete} />
      </div>

      <dl className="mt-2 space-y-1 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-1">
          <dt className="font-medium text-slate-500">Mobile:</dt>
          <dd><CallLink number={entry.mobile1} /></dd>
          {entry.mobile2 && <><span>/</span><dd><CallLink number={entry.mobile2} /></dd></>}
        </div>
        {entry.nextMeetingDate && (
          <div className="flex items-center gap-1.5">
            <dt className="font-medium text-slate-500">Next meeting:</dt>
            <dd>{entry.nextMeetingDate}</dd>
            {isDueOrOverdue(entry) && (
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                {entry.nextMeetingDate === todayStr() ? "Due today" : "Overdue"}
              </span>
            )}
          </div>
        )}
        <div><dt className="inline font-medium text-slate-500">Added by: </dt><dd className="inline">{entry.createdBy?.name} ({entry.createdBy?.role})</dd></div>
      </dl>

      {entry.history?.length > 0 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setHistoryOpen((v) => !v); }}
            className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            {historyOpen ? "Hide" : "Show"} history ({entry.history.length})
          </button>
          {historyOpen && (
            <ul className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 text-xs text-slate-500" onClick={(e) => e.stopPropagation()}>
              {entry.history.slice().reverse().map((h) => (
                <li key={h.id}>
                  <span className="font-medium capitalize text-slate-700">{h.type.replace("-", " ")}</span> · {h.by?.name} · {fmtDateTime(h.at)}
                  {h.text && <div className="text-slate-500">{h.text}</div>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

// Success ratio for customer entries: site-confirmed vs total, plus a
// per-staff breakdown. Only rendered for admin / subadmin.
function StatsPanel({ entries }) {
  const customerEntries = entries.filter((e) => e.type === "customer");
  const total = customerEntries.length;
  const confirmed = customerEntries.filter((e) => e.status === "site-confirmed").length;
  const cancelled = customerEntries.filter((e) => e.status === "cancelled").length;
  const pending = total - confirmed - cancelled;
  const rate = total ? Math.round((confirmed / total) * 100) : 0;

  const byStaff = useMemo(() => {
    const map = new Map();
    for (const e of customerEntries) {
      const key = e.createdBy?.name || "Unknown";
      if (!map.has(key)) map.set(key, { name: key, total: 0, confirmed: 0 });
      const row = map.get(key);
      row.total += 1;
      if (e.status === "site-confirmed") row.confirmed += 1;
    }
    return Array.from(map.values())
      .map((r) => ({ ...r, rate: r.total ? Math.round((r.confirmed / r.total) * 100) : 0 }))
      .sort((a, b) => b.rate - a.rate);
  }, [customerEntries]);

  if (total === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-800">Customer success ratio</h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{rate}% site-confirmed</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Total customers</p>
          <p className="text-lg font-semibold text-slate-800">{total}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700">Site-confirmed</p>
          <p className="text-lg font-semibold text-emerald-700">{confirmed}</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-xs text-amber-700">Pending</p>
          <p className="text-lg font-semibold text-amber-700">{pending}</p>
        </div>
        <div className="rounded-lg bg-rose-50 p-3">
          <p className="text-xs text-rose-700">Cancelled</p>
          <p className="text-lg font-semibold text-rose-700">{cancelled}</p>
        </div>
      </div>

      {byStaff.length > 1 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">By staff</p>
          <ul className="space-y-2">
            {byStaff.map((r) => (
              <li key={r.name} className="flex items-center gap-2 text-xs">
                <span className="w-24 flex-shrink-0 truncate text-slate-700">{r.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${r.rate}%` }} />
                </div>
                <span className="w-16 flex-shrink-0 text-right font-medium text-slate-600">{r.rate}% ({r.confirmed}/{r.total})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function EntryManager() {
  const { data: session } = useSession();
  const currentUser = {
    id: session?.user?.id,
    name: session?.user?.name || "Me",
    role: session?.user?.role || "staff",
  };
  const canSeeAll = CAN_SEE_ALL_ROLES.includes(currentUser.role);
  const canSeeStats = STATS_ROLES.includes(currentUser.role);
  const canSeeSuccessRatio = SUCCESS_RATIO_ROLES.includes(currentUser.role);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [entryType, setEntryType] = useState("customer");
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const [editingEntry, setEditingEntry] = useState(null);
  const [editEntryType, setEditEntryType] = useState("customer");
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [actionModal, setActionModal] = useState(null); // { entry, action }
  const [actionText, setActionText] = useState("");
  const [actionNextDate, setActionNextDate] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [detailEntryId, setDetailEntryId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // "due" and "activity" completely replace the normal list — dedicated
  // screens, not panels stacked on top of everything else.
  const [view, setView] = useState("list"); // "list" | "due" | "activity"
  const [showNotVisited, setShowNotVisited] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/entries");
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
      } else {
        showToast(data.message || "Failed to load entries", "error");
      }
    } catch {
      showToast("Something went wrong while loading entries", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const dueEntries = useMemo(() => entries.filter(isDueOrOverdue), [entries]);
  const notVisitedEntries = useMemo(() => entries.filter(isNotVisited), [entries]);
  const detailEntry = useMemo(() => entries.find((e) => e.id === detailEntryId) || null, [entries, detailEntryId]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => (statusFilter === "all" ? true : e.status === statusFilter))
      .filter((e) => {
        if (!canSeeStats) return true;
        if (!fromDate && !toDate) return true;
        if (!e.nextMeetingDate) return false;
        if (fromDate && e.nextMeetingDate < fromDate) return false;
        if (toDate && e.nextMeetingDate > toDate) return false;
        return true;
      })
      .filter((e) => {
        if (!q) return true;
        return (
          e.name?.toLowerCase().includes(q) ||
          e.mobile1?.includes(q) ||
          e.mobile2?.includes(q) ||
          e.siteAddress?.toLowerCase().includes(q)
        );
      });
  }, [entries, search, statusFilter, fromDate, toDate, canSeeStats]);

  const hasDateFilter = canSeeStats && !!(fromDate || toDate);
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setFromDate(""); setToDate(""); };

  // ── Add entry ──────────────────────────────────────────────────────────
  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  const submitNewEntry = async (payload) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showToast("Entry added successfully");
        setDuplicateWarning(null);
        resetForm();
        fetchEntries();
        return;
      }

      if (data.duplicate) {
        setDuplicateWarning({ message: data.message, existingEntry: data.existingEntry, pendingPayload: payload });
        return;
      }

      showToast(data.message || "Failed to add entry", "error");
    } catch {
      showToast("Something went wrong while adding the entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    const fields = entryType === "customer" ? CUSTOMER_FIELDS : MISTRY_FIELDS;
    for (const f of fields) {
      if (f.required && !form[f.name]?.trim()) {
        showToast(`${f.label} is required`, "error");
        return;
      }
    }
    await submitNewEntry({ type: entryType, ...form });
  };

  const handleForceAdd = async () => {
    if (!duplicateWarning) return;
    await submitNewEntry({ ...duplicateWarning.pendingPayload, force: true });
  };

  // ── Edit entry ─────────────────────────────────────────────────────────
  function openEditModal(entry) {
    setEditingEntry(entry);
    setEditEntryType(entry.type);
    setEditForm({
      mobile1: entry.mobile1 || "",
      mobile2: entry.mobile2 || "",
      name: entry.name || "",
      siteAddress: entry.siteAddress || "",
      permanentAddress: entry.permanentAddress || "",
      profession: entry.profession || "",
      mistryName: entry.mistryName || "",
      mistryNumber: entry.mistryNumber || "",
      architectName: entry.architectName || "",
      architectNumber: entry.architectNumber || "",
      nextMeetingDate: entry.nextMeetingDate || "",
      remark: "",
    });
  }

  function closeEditModal() {
    setEditingEntry(null);
    setEditForm(EMPTY_FORM);
  }

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    const fields = editEntryType === "customer" ? CUSTOMER_FIELDS : MISTRY_FIELDS;
    for (const f of fields) {
      if (f.required && !editForm[f.name]?.trim()) {
        showToast(`${f.label} is required`, "error");
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/entries/${editingEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Entry updated successfully");
        closeEditModal();
        fetchEntries();
      } else {
        showToast(data.message || "Failed to update entry", "error");
      }
    } catch {
      showToast("Something went wrong while updating the entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete (admin/sales only) ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/entries/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Entry deleted successfully");
        fetchEntries();
      } else {
        showToast(data.message || "Failed to delete entry", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
    }
  };

  // ── Status actions: call / onsite / cancel / site-confirm ──────────────
  function openActionModal(entry, action) {
    setActionModal({ entry, action });
    setActionText("");
    setActionNextDate(entry.nextMeetingDate || "");
  }

  const submitAction = async () => {
    if (!actionModal) return;
    const { entry, action } = actionModal;
    if (action === "cancel" && !actionText.trim()) {
      showToast("A reason is required to cancel", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: actionText.trim(),
          nextMeetingDate: action === "call" || action === "onsite" ? actionNextDate : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Entry updated successfully");
        setActionModal(null);
        fetchEntries();
      } else {
        showToast(data.message || "Failed to update entry", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const fields = entryType === "customer" ? CUSTOMER_FIELDS : MISTRY_FIELDS;
  const editFields = editEntryType === "customer" ? CUSTOMER_FIELDS : MISTRY_FIELDS;

  // ── Shared modals (used by both the list view and the due view) ────────
  const modals = (
    <>
      <DetailModal entry={detailEntry} onClose={() => setDetailEntryId(null)} />
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeEditModal}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-semibold text-slate-800">Edit {editEntryType === "customer" ? "Customer" : "Mistry"}</h3>
            <form onSubmit={handleEditSave} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {editFields.map((f) => (
                <Field key={f.name} field={f} value={editForm[f.name]} onChange={(name, value) => setEditForm((p) => ({ ...p, [name]: value }))} />
              ))}
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Next meeting date</label>
                <input
                  type="date"
                  value={editForm.nextMeetingDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, nextMeetingDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:col-span-2 sm:flex-row">
                <button type="button" onClick={closeEditModal} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                  {submitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setActionModal(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-800">{ACTION_TITLES[actionModal.action]}</h3>
            <textarea
              autoFocus
              rows={3}
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              placeholder={actionModal.action === "cancel" ? "Reason for cancelling…" : "Optional remark…"}
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {(actionModal.action === "call" || actionModal.action === "onsite") && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">Next meeting date</label>
                <input
                  type="date"
                  value={actionNextDate}
                  onChange={(e) => setActionNextDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
            <div className="mt-4 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <button onClick={() => setActionModal(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Close</button>
              <button
                disabled={submitting || (actionModal.action === "cancel" && !actionText.trim())}
                onClick={submitAction}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {submitting ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-slate-800">Delete entry</h3>
            <p className="mb-5 text-sm text-slate-600">
              Are you sure you want to delete the entry for &quot;{deleteTarget.name}&quot;? This cannot be undone.
            </p>
            <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
              <button onClick={handleDelete} disabled={submitting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {submitting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-amber-700">⚠ Number already exists</h3>
            <p className="mb-5 text-sm text-slate-600">{duplicateWarning.message}</p>
            <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <button onClick={() => setDuplicateWarning(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
              <button onClick={handleForceAdd} disabled={submitting} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60">
                {submitting ? "Saving…" : "Save anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ── Dedicated "Today's Updates" screen ──────────────────────────────────
  if (view === "activity") {
    return (
      <div className="space-y-4">
        <Toast toast={toast} />
        <ActivityLogView entries={entries} onBack={() => setView("list")} onOpenDetail={(id) => setDetailEntryId(id)} />
        {modals}
      </div>
    );
  }

  // ── Dedicated "Due & overdue" screen — replaces everything else while open ──
  if (view === "due") {
    return (
      <div className="space-y-4">
        <Toast toast={toast} />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back to entries
            </button>
            <h2 className="text-base font-semibold text-slate-800">Due &amp; overdue</h2>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">{dueEntries.length}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">Meetings due today or overdue by up to {NOT_VISITED_AFTER_DAYS} days. Anything older moves to Not Visited below.</p>

        {dueEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-400">
            Nothing due or overdue right now 🎉
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {dueEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                canDelete={canSeeAll}
                onAction={(e, a) => openActionModal(e, a)}
                onEdit={openEditModal}
                onDelete={setDeleteTarget}
                onOpenDetail={(e) => setDetailEntryId(e.id)}
              />
            ))}
          </div>
        )}

        {/* Not Visited — overdue by more than 5 days, kept separate so it
            doesn't clutter the fresh follow-up list above. */}
        {notVisitedEntries.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              onClick={() => setShowNotVisited((v) => !v)}
              className="flex w-full items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                Not Visited
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{notVisitedEntries.length}</span>
              </span>
              <svg className={`h-4 w-4 text-slate-400 transition-transform ${showNotVisited ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="mt-1 text-xs text-slate-500">Overdue by more than {NOT_VISITED_AFTER_DAYS} days — no longer counted as active follow-ups.</p>
            {showNotVisited && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {notVisitedEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    canDelete={canSeeAll}
                    onAction={(e, a) => openActionModal(e, a)}
                    onEdit={openEditModal}
                    onDelete={setDeleteTarget}
                    onOpenDetail={(e) => setDetailEntryId(e.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {modals}
      </div>
    );
  }

  // ── Normal entries view ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Signed in as <span className="font-medium text-slate-700">{currentUser.name}</span> ·{" "}
          <span className="capitalize">{currentUser.role}</span> · {canSeeAll ? "viewing all entries" : "viewing your entries only"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setView("activity")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Today&apos;s Updates
          </button>
          <button
            onClick={() => setView("due")}
            className="relative rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Due &amp; overdue
            {dueEntries.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {dueEntries.length}
              </span>
            )}
          </button>
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            {showForm ? "Close form" : "+ Add entry"}
          </button>
        </div>
      </div>

      {/* ── Add Entry form ── */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 max-w-xs">
            <label className="mb-1 block text-xs font-medium text-slate-600">Entry type</label>
            <select
              value={entryType}
              onChange={(e) => { setEntryType(e.target.value); setForm(EMPTY_FORM); }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="customer">Customer</option>
              <option value="mistry">Mistry</option>
            </select>
          </div>

          <form onSubmit={handleAddEntry} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <Field key={f.name} field={f} value={form[f.name]} onChange={updateField} />
            ))}
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Next meeting date</label>
              <input
                type="date"
                value={form.nextMeetingDate}
                onChange={(e) => updateField("nextMeetingDate", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Remark</label>
              <textarea
                rows={2}
                value={form.remark}
                onChange={(e) => updateField("remark", e.target.value)}
                placeholder="Any note about this entry…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col-reverse justify-end gap-2 sm:col-span-2 sm:flex-row">
              <button type="button" onClick={resetForm} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {submitting ? "Saving…" : `Save ${entryType}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Success ratio (admin only) ── */}
      {canSeeSuccessRatio && <StatsPanel entries={entries} />}

      {/* ── Filters ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${canSeeStats ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, mobile, address…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-8 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="site-confirmed">Site Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {canSeeStats && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">From date</label>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">To date</label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
        {(search || statusFilter !== "all" || hasDateFilter) && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">Filtering by next meeting date{hasDateFilter ? "" : " (none set)"}</span>
            <button onClick={clearFilters} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Clear filters</button>
          </div>
        )}
      </div>

      {/* ── Entries: table on larger screens, cards on small screens ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">Entries</h2>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            {filteredEntries.length} {search || statusFilter !== "all" || hasDateFilter ? "found" : "total"}
          </span>
        </div>

        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Loading entries…</p>
        ) : entries.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No entries yet. Tap "+ Add entry" to create one.</p>
        ) : filteredEntries.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No results match the current filters.</p>
        ) : (
          <>
            {/* Cards — small screens */}
            <div className="grid grid-cols-1 gap-3 p-4 sm:hidden">
              {filteredEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} canDelete={canSeeAll} onAction={openActionModal} onEdit={openEditModal} onDelete={setDeleteTarget} onOpenDetail={(e) => setDetailEntryId(e.id)} />
              ))}
            </div>

            {/* Table — sm and up */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Mobile</th>
                    <th className="px-5 py-3">Next meeting</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="hidden px-5 py-3 lg:table-cell">Added by</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} onClick={() => setDetailEntryId(entry.id)} className="cursor-pointer align-top hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{entry.name || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${entry.type === "customer" ? "bg-indigo-50 text-indigo-700" : "bg-orange-50 text-orange-700"}`}>
                          {entry.type === "customer" ? "Customer" : "Mistry"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <CallLink number={entry.mobile1} />
                          {entry.mobile2 && <CallLink number={entry.mobile2} className="text-xs text-slate-400 hover:text-sky-600 hover:underline" />}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {entry.nextMeetingDate || "—"}
                        {isDueOrOverdue(entry) && (
                          <span className="ml-1.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                            {entry.nextMeetingDate === todayStr() ? "Due today" : "Overdue"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[entry.status]}`}>{entry.status}</span>
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 lg:table-cell">{entry.createdBy?.name} <span className="text-slate-400">({entry.createdBy?.role})</span></td>
                      <td className="px-5 py-3 text-right">
                        <ActionMenu entry={entry} canDelete={canSeeAll} onAction={openActionModal} onEdit={openEditModal} onDelete={setDeleteTarget} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modals}
    </div>
  );
}