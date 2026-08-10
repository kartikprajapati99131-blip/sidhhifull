"use client";

import { useState, useEffect } from "react";

export const PRODUCTS = ["Laminate", "Venner", "Plywood", "Flush Door", "Glass", "Hardware"];
export const ASSIGNEES = ["Sanjay Bhai", "Haresh Bhai", "Vijay Bhai", "Bharat Bhai", "Nitin Bhai", "Chetan Bhai"];

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const STATUS_LABELS = {
  pending: "Pending",
  "call-site": "Call / Site",
  "need-visit": "Need Visit",
  "follow-up": "Follow Up",
  completed: "Completed",
};

export const STATUS_BADGE = {
  pending: "bg-slate-100 text-slate-600",
  "call-site": "bg-sky-50 text-sky-700",
  "need-visit": "bg-amber-50 text-amber-700",
  "follow-up": "bg-violet-50 text-violet-700",
  completed: "bg-emerald-50 text-emerald-700",
};

export const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function isNonVisiting(entry) {
  if (entry.status === "completed") return false;
  return Date.now() - new Date(entry.lastUpdatedAt).getTime() >= SEVEN_DAYS_MS;
}

// The name of whoever most recently touched the record — falls back
// gracefully for records created before this tracking existed.
export function lastActor(entry) {
  return entry.lastUpdatedBy || entry.registeredBy || entry.history?.[entry.history.length - 1]?.updatedBy || "—";
}

// Two-letter initials for a person's name, used in the little avatar chips.
export function initials(name) {
  if (!name || name === "—") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_PALETTE = [
  "bg-indigo-100 text-indigo-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

function paletteFor(name) {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function Avatar({ name, size = 7 }) {
  return (
    <span
      title={name}
      className={`inline-flex h-${size} w-${size} shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${paletteFor(
        name
      )}`}
      style={{ height: `${size * 4}px`, width: `${size * 4}px` }}
    >
      {initials(name)}
    </span>
  );
}

// Debounce a value so we don't hammer the API on every keystroke.
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] animate-[slideUp_0.25s_ease-out] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
        isError ? "bg-red-600" : "bg-emerald-600"
      }`}
      role="status"
    >
      {toast.message}
    </div>
  );
}

export function StatusBadge({ status, nonVisiting }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUS_BADGE[status] || "bg-slate-100 text-slate-600"
      } ${nonVisiting ? "ring-2 ring-red-400" : ""}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// Small dashboard stat card used at the top of both pages.
export function StatCard({ label, value, tone = "slate", icon, onClick, active }) {
  const tones = {
    slate: "bg-white border-slate-200 text-slate-900",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-900",
    amber: "bg-amber-50 border-amber-100 text-amber-900",
    red: "bg-red-50 border-red-100 text-red-900",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-900",
  };
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3.5 text-left shadow-sm transition ${
        tones[tone] || tones.slate
      } ${onClick ? "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0" : ""} ${
        active ? "ring-2 ring-offset-1 ring-indigo-400" : ""
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
        {icon && <span className="text-base leading-none opacity-80">{icon}</span>}
      </div>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
    </Comp>
  );
}

export const STATUS_ICON = {
  pending: "🕓",
  "call-site": "☎",
  "need-visit": "⚑",
  "follow-up": "↻",
  completed: "✅",
};

export const STATUS_ACCENT = {
  pending: "slate",
  "call-site": "sky",
  "need-visit": "amber",
  "follow-up": "violet",
  completed: "emerald",
};

const ACCENT_TONES = {
  indigo: { bg: "from-indigo-50", icon: "bg-indigo-100 text-indigo-600" },
  emerald: { bg: "from-emerald-50", icon: "bg-emerald-100 text-emerald-600" },
  amber: { bg: "from-amber-50", icon: "bg-amber-100 text-amber-600" },
  violet: { bg: "from-violet-50", icon: "bg-violet-100 text-violet-600" },
  sky: { bg: "from-sky-50", icon: "bg-sky-100 text-sky-600" },
  red: { bg: "from-red-50", icon: "bg-red-100 text-red-600" },
  slate: { bg: "from-slate-50", icon: "bg-slate-100 text-slate-600" },
};

// Reusable modal shell with a proper header: an icon bubble, title,
// optional subtitle, a soft gradient wash tinted to the action's accent
// color, and a built-in close button — so every popup in the app shares
// the same polished chrome instead of each screen hand-rolling its own.
// Backdrop click-to-close + Escape-to-close + fade/scale-in are baked in.
export function Modal({ onClose, maxWidth = "max-w-sm", icon, title, subtitle, accent = "indigo", headerRight, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tone = ACCENT_TONES[accent] || ACCENT_TONES.indigo;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-[popIn_0.18s_ease-out] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || icon) && (
          <div className={`flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-b ${tone.bg} to-white px-5 py-4`}>
            <div className="flex min-w-0 items-start gap-3">
              {icon && (
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg shadow-sm ${tone.icon}`}>
                  {icon}
                </span>
              )}
              <div className="min-w-0">
                {title && <h3 className="truncate text-base font-semibold text-slate-800">{title}</h3>}
                {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerRight}
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// Shared keyframes both pages rely on for toast/modal/menu animations.
export const SHARED_KEYFRAMES = `
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes popIn { from { opacity: 0; transform: translateY(6px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes menuIn { from { opacity: 0; transform: scale(0.96) translateY(-4px) } to { opacity: 1; transform: scale(1) translateY(0) } }
`;

// Very small CSV export helper — good enough for "export what's on screen"
// without pulling in a dependency.
export function exportToCsv(filename, rows, columns) {
  const escape = (val) => {
    const s = val === null || val === undefined ? "" : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(","));
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
