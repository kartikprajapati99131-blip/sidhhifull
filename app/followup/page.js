"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";

// Roles that can see EVERY customer entry (not just their own).
const CAN_SEE_ALL_ROLES = ["admin", "subadmin", "sales"];

// Roles that can see EVERY mistry entry, added by anyone. Sales is
// deliberately excluded: sales can see all customers, but only the Mistry
// entries they personally created — same rule enforced server-side in
// app/api/entries/route.js (CAN_SEE_ALL_MISTRY_ROLES).
const CAN_SEE_ALL_MISTRY_ROLES = ["admin", "subadmin"];

// Roles that can delete an entry. Sales can view/add/edit but NOT delete.
const CAN_DELETE_ROLES = ["admin", "subadmin"];

// Roles that can open the "Due" screen — entries due today or overdue by
// up to NOT_VISITED_AFTER_DAYS days. Sales IS included.
const DUE_VIEW_ROLES = ["admin", "subadmin", "sales"];

// Roles that can open the "Overdue" screen — entries overdue by MORE than
// NOT_VISITED_AFTER_DAYS days. This is now its own separate screen (not
// nested inside Due), and sales IS included, same as Due.
const OVERDUE_VIEW_ROLES = ["admin", "subadmin", "sales"];

// Roles that can open "Today's Updates" (the activity log). Sales IS
// included, but gets a personal-only version of the screen — see
// restrictToUserId below — titled "My Updates" and showing only what that
// sales person themselves logged.
const ACTIVITY_VIEW_ROLES = ["admin", "subadmin", "sales"];

// Roles that can see the date-range filter and the "Added by" dropdown
// filter on the main list. Sales is intentionally NOT in this list.
const ADMIN_SUBADMIN_ROLES = ["admin", "subadmin"];

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
  visited: "Log a visit",
};

const ACTIVITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "added", label: "➕ Added" },
  { value: "call", label: "📞 Call" },
  { value: "onsite", label: "🏗️ On-site" },
  { value: "visited", label: "🚩 Visited" },
  { value: "site-confirm", label: "✅ Confirmed" },
  { value: "cancel", label: "❌ Cancelled" },
  { value: "edit", label: "✏️ Edited" },
];

// Customer / Mistry toggle — shared across the main list, Today's Updates,
// Due, and Overdue so picking "Customer" hides Mistry entries everywhere
// and vice versa.
const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "customer", label: "Customer" },
  { value: "mistry", label: "Mistry" },
];

// Sittos / Magnus / CPL tags. Picked (multi-select) whenever a "Confirm
// site" or "Mark visited" action is logged; the tag FILTER below picks one
// at a time (same "All / X / Y / Z" pattern as the type toggle) and is
// shared across every screen — exactly like TYPE_FILTERS.
const VISIT_TAGS = ["Sittos", "Magnus", "CPL"];

const TAG_FILTERS = [
  { value: "all", label: "All" },
  ...VISIT_TAGS.map((t) => ({ value: t, label: t })),
];

// Customer-only filter: does this customer have a Mistry and/or an
// Architect on file? Choosing anything other than "All" implicitly narrows
// the list to customer entries, since mistry-type entries never carry
// these fields.
const REFERRAL_FILTERS = [
  { value: "all", label: "All" },
  { value: "mistry", label: "Has Mistry" },
  { value: "architect", label: "Has Architect" },
];

const hasMistryInfo = (e) => Boolean(e.mistryName?.trim() || e.mistryNumber?.trim());
const hasArchitectInfo = (e) => Boolean(e.architectName?.trim() || e.architectNumber?.trim());

// The full, current set of tags for an entry. Prefers the entry's own
// `tags` field (set by the backend), but if that ever comes back empty —
// e.g. an older API response — falls back to rebuilding it from the
// history itself (every "site-confirm" / "visited" action's tags, unioned).
function getEntryTags(entry) {
  if (entry?.tags?.length) return entry.tags;
  const set = new Set();
  for (const h of entry?.history || []) {
    if ((h.type === "site-confirm" || h.type === "visited") && h.tags?.length) {
      h.tags.forEach((t) => set.add(t));
    }
  }
  return Array.from(set);
}

// Turns a set of tags into one combined label in a fixed order, e.g.
// picking Magnus then Sittos always displays as "Sittos-Magnus".
function combineTags(tags) {
  if (!tags || tags.length === 0) return "";
  return VISIT_TAGS.filter((t) => tags.includes(t)).join("-");
}

// Generic pill-style filter toggle — used for both the Customer/Mistry
// type filter and the Sittos/Magnus/CPL tag filter, wherever they appear.
function FilterToggle({ options, value, onChange, className = "" }) {
  return (
    <div className={`inline-flex flex-wrap rounded-lg border border-slate-300 bg-white p-0.5 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            value === o.value ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Single combined tag badge — e.g. picking Sittos + Magnus always renders
// as ONE pill reading "Sittos-Magnus".
function TagBadge({ tags, size = "sm" }) {
  const label = combineTags(tags);
  if (!label) return null;
  const cls = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[10px]";
  return (
    <span className={`inline-flex items-center rounded-full bg-teal-50 font-medium text-teal-700 ${cls}`}>
      {label}
    </span>
  );
}

// "Today's Updates" / "My Updates" — every add / call / on-site / visit /
// confirm / cancel / edit across all entries currently visible to this
// user, newest first, with Today/Yesterday/N-days-ago labels and an
// optional date range.
//
// restrictToUserId: when set (sales), the feed is narrowed down to ONLY
// activity performed by that user — the screen becomes "My Updates" and
// shows exactly what that sales person has personally logged, nothing
// added or actioned by anyone else.
function ActivityLogView({
  entries,
  typeFilter,
  onTypeFilterChange,
  tagFilter,
  onTagFilterChange,
  onBack,
  onOpenDetail,
  restrictToUserId,
}) {
  const [filter, setFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fullFeed = useMemo(() => buildActivityFeed(entries), [entries]);
  const feed = useMemo(
    () => (restrictToUserId ? fullFeed.filter((a) => a.by?.id === restrictToUserId) : fullFeed),
    [fullFeed, restrictToUserId]
  );
  const hasCustomRange = Boolean(dateFrom || dateTo);

  const filtered = feed.filter((a) => {
    if (typeFilter !== "all" && a.entry.type !== typeFilter) return false;
    if (tagFilter !== "all" && !getEntryTags(a.entry).includes(tagFilter)) return false;
    if (filter !== "all" && a.activity !== filter) return false;
    if (hasCustomRange) return isWithinRange(a.time, dateFrom, dateTo);
    return true;
  });

  const todayCount = feed.filter((a) => isToday(a.time)).length;
  const clearRange = () => { setDateFrom(""); setDateTo(""); };
  const screenTitle = restrictToUserId ? "My Updates" : "Today's Updates";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">Back to entries</span>
        </button>
        <h2 className="text-base font-semibold text-slate-800">{screenTitle}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <FilterToggle options={TAG_FILTERS} value={tagFilter} onChange={onTagFilterChange} />
          <FilterToggle options={TYPE_FILTERS} value={typeFilter} onChange={onTypeFilterChange} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{restrictToUserId ? "Your Updates" : "All Updates"}</h3>
            <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
              {restrictToUserId
                ? "Everything you've personally logged — new entries, calls, on-site visits, visit logs, confirmations, cancellations, edits"
                : "Every remark — new entries, calls, on-site visits, visit logs, confirmations, cancellations, edits"}
            </p>
          </div>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">{todayCount} today</span>
        </div>

        {/* Mobile: one compact row — activity dropdown + a Date toggle */}
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
                  {a.tags?.length > 0 && <TagBadge tags={a.tags} />}
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
                        {a.tags?.length > 0 && <TagBadge tags={a.tags} />}
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
  { action: "visited", label: "Mark visited" },
  { action: "call", label: "Log call" },
  { action: "onsite", label: "Log on-site" },
  { action: "cancel", label: "Cancel", danger: true },
];

const HISTORY_LABEL = {
  note: "Note",
  call: "Called",
  onsite: "On-site Visit",
  visited: "Visited",
  cancel: "Cancelled",
  "site-confirm": "Site Confirmed",
  edit: "Edited",
};

const HISTORY_DOT = {
  note: "bg-slate-400",
  call: "bg-sky-500",
  onsite: "bg-violet-500",
  visited: "bg-teal-500",
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

// Due screen: only entries due today, or overdue by up to 5 days.
const isDueOrOverdue = (e) => {
  if (e.status !== "pending" || !e.nextMeetingDate) return false;
  const d = daysOverdue(e);
  return d >= 0 && d <= NOT_VISITED_AFTER_DAYS;
};

// Overdue screen: overdue by MORE than 5 days. This is its own separate
// screen now, no longer nested inside Due — same visibility rule as Due
// (admin, subadmin, sales all get their own "Overdue" button).
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
  visited: { label: "🚩 Visited", bg: "bg-teal-50", text: "text-teal-700" },
  "site-confirm": { label: "✅ Site confirmed", bg: "bg-emerald-50", text: "text-emerald-700" },
  cancel: { label: "❌ Cancelled", bg: "bg-rose-50", text: "text-rose-700" },
  edit: { label: "✏️ Details edited", bg: "bg-amber-50", text: "text-amber-700" },
};

// Flattens every entry's creation + full history into one timestamp-sorted
// activity feed.
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
        tags: [],
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
        tags: h.tags || [],
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

// One dropdown holding every status action (Confirm / Visited / Call /
// On-site / Cancel) plus Edit and (if allowed) Delete.
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

// Always renders — shows "—" instead of hiding the row when a field is
// empty, so the popup reads as a complete record rather than a sparse one.
function DetailRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{value || <span className="text-slate-400">—</span>}</dd>
    </div>
  );
}

// Full-detail popup opened by clicking any entry — every field, plus the
// complete history timeline.
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
              <TagBadge tags={getEntryTags(entry)} />
            </div>
            <h3 className="mt-1.5 text-lg font-semibold text-slate-900">{entry.name || "—"}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">✕</button>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <DetailRow label="Mobile No 1" value={entry.mobile1 && <CallLink number={entry.mobile1} />} />
          <DetailRow label="Mobile No 2" value={entry.mobile2 && <CallLink number={entry.mobile2} />} />
          <DetailRow label="Next meeting date" value={entry.nextMeetingDate} />
          <DetailRow label="Tags" value={combineTags(getEntryTags(entry)) || null} />

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
                  {h.tags?.length > 0 && <div className="mt-1"><TagBadge tags={h.tags} size="xs" /></div>}
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
// horizontally-scrolling table row, and for every card-grid screen
// (main list, Due, Overdue, Completed, Cancelled).
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
            <TagBadge tags={getEntryTags(entry)} />
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
        {entry.type === "customer" && (hasMistryInfo(entry) || hasArchitectInfo(entry)) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {hasMistryInfo(entry) && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">Has Mistry</span>}
            {hasArchitectInfo(entry) && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">Has Architect</span>}
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
                  {h.tags?.length > 0 && <TagBadge tags={h.tags} size="xs" />}
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
 

// Shared shell for the Due, Overdue, Completed, and Cancelled screens —
// same header pattern (back button, title, count badge, tag/type filters),
// same subtitle-then-grid-of-cards layout, just fed different
// entries/copy from the caller.
function EntryScreen({
  title,
  badgeCount,
  badgeClass,
  subtitle,
  entries,
  emptyMessage,
  tagFilter,
  onTagFilterChange,
  typeFilter,
  onTypeFilterChange,
  onBack,
  canDelete,
  onAction,
  onEdit,
  onDelete,
  onOpenDetail,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Back to entries
          </button>
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>{badgeCount}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterToggle options={TAG_FILTERS} value={tagFilter} onChange={onTagFilterChange} />
          <FilterToggle options={TYPE_FILTERS} value={typeFilter} onChange={onTypeFilterChange} />
        </div>
      </div>
      <p className="text-xs text-slate-500">{subtitle}</p>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              canDelete={canDelete}
              onAction={onAction}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenDetail={onOpenDetail}
            />
          ))}
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
  // canSeeAllMistry = allowed to see Mistry entries added by other staff.
  // Everyone else (sales included) sees ALL customers via canSeeAll, but
  // Mistry entries are additionally restricted to "only what I added" —
  // enforced both here (defense in depth) and, authoritatively, on the
  // server in app/api/entries/route.js.
  const canSeeAllMistry = CAN_SEE_ALL_MISTRY_ROLES.includes(currentUser.role);
  // canDelete is separate from canSeeAll: sales can view all entries but
  // must NOT be able to delete them — only admin and subadmin can.
  const canDelete = CAN_DELETE_ROLES.includes(currentUser.role);
  // canSeeDue = allowed to open "Due" (today + up to NOT_VISITED_AFTER_DAYS
  // days overdue). Sales IS included.
  const canSeeDue = DUE_VIEW_ROLES.includes(currentUser.role);
  // canSeeOverdue = allowed to open "Overdue" (more than
  // NOT_VISITED_AFTER_DAYS days overdue). Its own separate screen and
  // button now — sales IS included, same as Due.
  const canSeeOverdue = OVERDUE_VIEW_ROLES.includes(currentUser.role);
  // canSeeActivity = allowed to open "Today's Updates" / "My Updates".
  // Sales IS included, but gets a personal-only feed — see
  // restrictToUserId passed to ActivityLogView below.
  const canSeeActivity = ACTIVITY_VIEW_ROLES.includes(currentUser.role);
  // canSeeStats = allowed to see the date-range filter and the "Added by"
  // dropdown filter on the main list. Sales is deliberately excluded here.
  const canSeeStats = ADMIN_SUBADMIN_ROLES.includes(currentUser.role);
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
  const [actionTags, setActionTags] = useState([]); // Sittos/Magnus/CPL — used by site-confirm & visited

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [detailEntryId, setDetailEntryId] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "customer" | "mistry" — shared everywhere
  const [tagFilter, setTagFilter] = useState("all"); // "all" | "Sittos" | "Magnus" | "CPL" — shared everywhere
  const [referralFilter, setReferralFilter] = useState("all"); // "all" | "mistry" | "architect" — customer-only, main list
  // "Added by" — admin/subadmin only. Shortlists EITHER customer or mistry
  // entries down to a single staff member's additions. Shared through
  // baseFilteredEntries so it also narrows Due / Overdue / Completed /
  // Cancelled / Today's Updates.
  const [addedByFilter, setAddedByFilter] = useState("all"); // "all" | createdBy.id
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // "due", "overdue", "activity", "completed", and "cancelled" completely
  // replace the normal list — dedicated screens, not panels stacked on top
  // of everything else. The main "list" view only ever shows PENDING
  // entries; site-confirmed and cancelled entries live exclusively on
  // their own dedicated screens.
  const [view, setView] = useState("list"); // "list" | "due" | "overdue" | "activity" | "completed" | "cancelled"

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

  // If a role ends up on a gated view it isn't allowed to see — e.g. role
  // changes mid-session, stale state — bounce straight back to the normal
  // list. Each view is checked against its own permission.
  useEffect(() => {
    if (view === "due" && !canSeeDue) setView("list");
    if (view === "overdue" && !canSeeOverdue) setView("list");
    if (view === "activity" && !canSeeActivity) setView("list");
  }, [view, canSeeDue, canSeeOverdue, canSeeActivity]);

  // Base pipeline shared by the main list, Due, Overdue, Completed,
  // Cancelled, and (indirectly, via its own props) Today's Updates: entry
  // type, visit tag, Mistry-ownership restriction, and the admin/subadmin
  // "Added by" shortlist.
  const baseFilteredEntries = useMemo(
    () =>
      entries.filter((e) => {
        if (typeFilter !== "all" && e.type !== typeFilter) return false;
        if (tagFilter !== "all" && !getEntryTags(e).includes(tagFilter)) return false;
       
        if (
          e.type === "mistry" &&
          !canSeeAllMistry &&
          e.createdBy?.id !== currentUser.id &&
          !(currentUser.role === "sales" && isNotVisited(e))
        ) {
          return false;
        }
        // Admin/subadmin-only shortlist by whoever added the entry —
        // works for both Customer and Mistry lists.
        if (addedByFilter !== "all" && e.createdBy?.id !== addedByFilter) return false;
        return true;
      }),
    [entries, typeFilter, tagFilter, canSeeAllMistry, currentUser.id, currentUser.role, addedByFilter]
  );

  const dueEntries = useMemo(() => baseFilteredEntries.filter(isDueOrOverdue), [baseFilteredEntries]);
  const notVisitedEntries = useMemo(() => baseFilteredEntries.filter(isNotVisited), [baseFilteredEntries]);

  // Sort by name, A → Z. Entries with no name fall to the end.
  const sortByNameAsc = (list) =>
    [...list].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));

  // Completed screen: every site-confirmed entry, alphabetical by name.
  const completedEntries = useMemo(
    () => sortByNameAsc(baseFilteredEntries.filter((e) => e.status === "site-confirmed")),
    [baseFilteredEntries]
  );
  // Cancelled screen: every cancelled entry, alphabetical by name.
  const cancelledEntries = useMemo(
    () => sortByNameAsc(baseFilteredEntries.filter((e) => e.status === "cancelled")),
    [baseFilteredEntries]
  );

  const detailEntry = useMemo(() => entries.find((e) => e.id === detailEntryId) || null, [entries, detailEntryId]);

  const addedByOptions = useMemo(() => {
    if (!canSeeStats) return [];
    const map = new Map();
    for (const e of entries) {
      if (e.createdBy?.id) map.set(e.createdBy.id, e.createdBy.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, canSeeStats]);

  // Main "Entries" table/cards: PENDING ONLY. Site-confirmed and cancelled
  // entries never show up here — they live exclusively on the dedicated
  // Completed / Cancelled screens.
  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseFilteredEntries
      .filter((e) => e.status === "pending")
      .filter((e) => {
        if (referralFilter === "all") return true;
        if (e.type !== "customer") return false;
        return referralFilter === "mistry" ? hasMistryInfo(e) : hasArchitectInfo(e);
      })
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
          e.siteAddress?.toLowerCase().includes(q) ||
          e.permanentAddress?.toLowerCase().includes(q) ||
          e.mistryName?.toLowerCase().includes(q) ||
          e.mistryNumber?.includes(q) ||
          e.architectName?.toLowerCase().includes(q) ||
          e.architectNumber?.includes(q)
        );
      });
  }, [baseFilteredEntries, search, referralFilter, fromDate, toDate, canSeeStats]);

  const hasDateFilter = canSeeStats && !!(fromDate || toDate);
  const hasActiveFilters =
    search ||
    typeFilter !== "all" ||
    tagFilter !== "all" ||
    referralFilter !== "all" ||
    addedByFilter !== "all" ||
    hasDateFilter;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setTagFilter("all");
    setReferralFilter("all");
    setAddedByFilter("all");
    setFromDate("");
    setToDate("");
  };

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

  // ── Delete (admin/subadmin only) ────────────────────────────────────────
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

  // ── Status / activity actions: call / onsite / visited / cancel /
  // site-confirm. "site-confirm" and "visited" additionally collect a
  // multi-select of Sittos/Magnus/CPL tags, which get merged onto the
  // entry (so the tag filter can find it) as well as stamped on this one
  // history entry (so Today's Updates can show exactly what was picked).
  function openActionModal(entry, action) {
    const needsTags = action === "site-confirm" || action === "visited";
    setActionModal({ entry, action });
    setActionText("");
    setActionNextDate(entry.nextMeetingDate || "");
    // Pre-select whatever Sittos/Magnus/CPL tags this entry already
    // carries, so reopening "Confirm site" / "Mark visited" reflects what
    // was actually saved last time instead of always starting blank.
    setActionTags(needsTags ? getEntryTags(entry) : []);
  }

  function toggleActionTag(tag) {
    setActionTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const submitAction = async () => {
    if (!actionModal) return;
    const { entry, action } = actionModal;
    if (action === "cancel" && !actionText.trim()) {
      showToast("A reason is required to cancel", "error");
      return;
    }
    const needsTags = action === "site-confirm" || action === "visited";
    setSubmitting(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: actionText.trim(),
          nextMeetingDate: action === "call" || action === "onsite" ? actionNextDate : undefined,
          tags: needsTags ? actionTags : undefined,
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
  const actionNeedsTags = actionModal && (actionModal.action === "site-confirm" || actionModal.action === "visited");

  // ── Shared modals (used by every view) ──────────────────────────────────
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
            {actionNeedsTags && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">Tags (optional, pick any that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {VISIT_TAGS.map((tag) => {
                    const active = actionTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleActionTag(tag)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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

  // ── Dedicated "Today's Updates" / "My Updates" screen — admin,
  // subadmin, and sales. Sales gets restrictToUserId set, so the feed is
  // narrowed to only what that sales person themselves logged. ──────────
  if (view === "activity" && canSeeActivity) {
    return (
      <div className="space-y-4">
        <Toast toast={toast} />
        <ActivityLogView
          entries={entries}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          onBack={() => setView("list")}
          onOpenDetail={(id) => setDetailEntryId(id)}
          restrictToUserId={currentUser.role === "sales" ? currentUser.id : null}
        />
        {modals}
      </div>
    );
  }

  // ── Dedicated "Due" screen — admin, subadmin, AND sales. Only ever
  // lists entries due today or overdue by up to NOT_VISITED_AFTER_DAYS
  // days. ─────────────────────────────────────────────────────────────
  if (view === "due" && canSeeDue) {
    return (
      <div className="space-y-4">
        <Toast toast={toast} />
        <EntryScreen
          title="Due"
          badgeCount={dueEntries.length}
          badgeClass="bg-red-50 text-red-600"
          subtitle={`Meetings due today or overdue by up to ${NOT_VISITED_AFTER_DAYS} days. Anything older shows up under Overdue instead.`}
          entries={dueEntries}
          emptyMessage="Nothing due or overdue right now 🎉"
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onBack={() => setView("list")}
          canDelete={canDelete}
          onAction={(e, a) => openActionModal(e, a)}
          onEdit={openEditModal}
          onDelete={setDeleteTarget}
          onOpenDetail={(e) => setDetailEntryId(e.id)}
        />
        {modals}
      </div>
    );
  }

  // ── Dedicated "Overdue" screen — admin, subadmin, AND sales. Its own
  // separate button/screen now, no longer nested inside Due. Only ever
  // lists entries overdue by MORE than NOT_VISITED_AFTER_DAYS days. ────
  if (view === "overdue" && canSeeOverdue) {
    return (
      <div className="space-y-4">
        <Toast toast={toast} />
        <EntryScreen
          title="Overdue"
          badgeCount={notVisitedEntries.length}
          badgeClass="bg-slate-100 text-slate-600"
          subtitle={`Overdue by more than ${NOT_VISITED_AFTER_DAYS} days — no longer counted with today's Due list.`}
          entries={notVisitedEntries}
          emptyMessage="Nothing overdue 🎉"
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onBack={() => setView("list")}
          canDelete={canDelete}
          onAction={(e, a) => openActionModal(e, a)}
          onEdit={openEditModal}
          onDelete={setDeleteTarget}
          onOpenDetail={(e) => setDetailEntryId(e.id)}
        />
        {modals}
      </div>
    );
  }

  // ── Dedicated "Completed" screen — every site-confirmed entry, A → Z.
  // Same visibility as the main list itself: no extra role gate, just the
  // ordinary Mistry-ownership / Added-by filtering already baked into
  // baseFilteredEntries. ───────────────────────────────────────────────
  if (view === "completed") {
    return (
      <div className="space-y-4">
        <Toast toast={toast} />
        <EntryScreen
          title="Completed"
          badgeCount={completedEntries.length}
          badgeClass="bg-emerald-50 text-emerald-700"
          subtitle="Every site-confirmed entry, sorted alphabetically (A → Z)."
          entries={completedEntries}
          emptyMessage="No site-confirmed entries yet."
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onBack={() => setView("list")}
          canDelete={canDelete}
          onAction={(e, a) => openActionModal(e, a)}
          onEdit={openEditModal}
          onDelete={setDeleteTarget}
          onOpenDetail={(e) => setDetailEntryId(e.id)}
        />
        {modals}
      </div>
    );
  }

  // ── Dedicated "Cancelled" screen — every cancelled entry, A → Z. Same
  // visibility as the main list itself. ─────────────────────────────────
  if (view === "cancelled") {
    return (
      <div className="space-y-4">
        <Toast toast={toast} />
        <EntryScreen
          title="Cancelled"
          badgeCount={cancelledEntries.length}
          badgeClass="bg-rose-50 text-rose-700"
          subtitle="Every cancelled entry, sorted alphabetically (A → Z)."
          entries={cancelledEntries}
          emptyMessage="No cancelled entries."
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onBack={() => setView("list")}
          canDelete={canDelete}
          onAction={(e, a) => openActionModal(e, a)}
          onEdit={openEditModal}
          onDelete={setDeleteTarget}
          onOpenDetail={(e) => setDetailEntryId(e.id)}
        />
        {modals}
      </div>
    );
  }

  // ── Normal entries view (PENDING ONLY) ──────────────────────────────────
  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Signed in as <span className="font-medium text-slate-700">{currentUser.name}</span> ·{" "}
          <span className="capitalize">{currentUser.role}</span> ·{" "}
          {canSeeAllMistry
            ? "viewing all entries"
            : canSeeAll
            ? "viewing all customers · your Mistry entries only"
            : "viewing your entries only"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {/* Today's Updates / My Updates: admin, subadmin, and sales. Sales
              gets its own personal-activity-only version of this screen. */}
          {canSeeActivity && (
            <button
              onClick={() => setView("activity")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {currentUser.role === "sales" ? "My Updates" : "Today's Updates"}
            </button>
          )}
          {/* Due: entries due today or overdue by up to NOT_VISITED_AFTER_DAYS
              days. Admin, subadmin, and sales. */}
          {canSeeDue && (
            <button
              onClick={() => setView("due")}
              className="relative rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Due
              {dueEntries.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {dueEntries.length}
                </span>
              )}
            </button>
          )}
          {/* Overdue: overdue by MORE than NOT_VISITED_AFTER_DAYS days — its
              own separate button/screen now, no longer nested inside Due.
              Admin, subadmin, and sales. */}
          {canSeeOverdue && (
            <button
              onClick={() => setView("overdue")}
              className="relative rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Overdue
              {notVisitedEntries.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-slate-500 px-1 text-[10px] font-bold text-white">
                  {notVisitedEntries.length}
                </span>
              )}
            </button>
          )}
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-medium text-slate-600">Entry type</label>
          <FilterToggle options={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-medium text-slate-600">Tag</label>
          <FilterToggle options={TAG_FILTERS} value={tagFilter} onChange={setTagFilter} />
        </div>
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${canSeeStats ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, mobile, address, mistry, architect…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-8 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Referral</label>
            <select
              value={referralFilter}
              onChange={(e) => setReferralFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {REFERRAL_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          {/* Admin/subadmin only: shortlist by whoever added the entry —
              works across both Customer and Mistry lists. */}
          {canSeeStats && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Added by</label>
              <select
                value={addedByFilter}
                onChange={(e) => setAddedByFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Everyone</option>
                {addedByOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}
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
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">Filtering by next meeting date{hasDateFilter ? "" : " (none set)"}</span>
            <button onClick={clearFilters} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Clear filters</button>
          </div>
        )}
      </div>

      {/* ── Entries: table on larger screens, cards on small screens ──
          Pending only — completed (site-confirmed) and cancelled entries
          live on their own dedicated screens, linked right below. ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">Entries</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              {filteredEntries.length} {hasActiveFilters ? "found" : "total"}
            </span>
            {/* Completed / Cancelled: dedicated alphabetical (A → Z) pages.
                Site-confirmed and cancelled entries never show in the
                pending table above — they only live here. */}
            <button
              onClick={() => setView("completed")}
              className="relative rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Completed
              {completedEntries.length > 0 && (
                <span className="ml-1.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {completedEntries.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setView("cancelled")}
              className="relative rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
            >
              Cancelled
              {cancelledEntries.length > 0 && (
                <span className="ml-1.5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {cancelledEntries.length}
                </span>
              )}
            </button>
          </div>
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
                <EntryCard key={entry.id} entry={entry} canDelete={canDelete} onAction={openActionModal} onEdit={openEditModal} onDelete={setDeleteTarget} onOpenDetail={(e) => setDetailEntryId(e.id)} />
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
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {entry.name || "—"}
                        <TagBadge tags={getEntryTags(entry)} size="xs" />
                      </td>
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
                        <ActionMenu entry={entry} canDelete={canDelete} onAction={openActionModal} onEdit={openEditModal} onDelete={setDeleteTarget} />
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