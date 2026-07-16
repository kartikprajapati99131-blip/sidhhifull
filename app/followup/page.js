"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";

/* ────────────────────────────── CONFIG ────────────────────────────── */

const ROLES = ["admin", "subadmin", "staff", "sales"];
const CAN_SEE_ALL_ROLES = ["admin", "sales"];
const SHOW_ROLE_SWITCHER = true;
const STORAGE_KEY = "members_entries_v1";

const STATUS = {
  pending: { label: "Pending", classes: "bg-amber-100 text-amber-800 ring-amber-600/20" },
  "site-confirmed": { label: "Site Confirmed", classes: "bg-emerald-100 text-emerald-800 ring-emerald-600/20" },
  cancelled: { label: "Cancelled", classes: "bg-rose-100 text-rose-800 ring-rose-600/20" },
};

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

/* ────────────────────────────── HELPERS ────────────────────────────── */

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function isDueOrOverdue(entry) {
  return entry.status === "pending" && entry.nextMeetingDate && entry.nextMeetingDate <= todayStr();
}

function findDuplicateMobile(entries, mobile1, mobile2, excludeId) {
  const m1 = mobile1?.trim();
  const m2 = mobile2?.trim();
  if (!m1 && !m2) return null;
  return entries.find((e) => {
    if (excludeId && e.id === excludeId) return false;
    const nums = [e.mobile1, e.mobile2].filter(Boolean);
    return (m1 && nums.includes(m1)) || (m2 && nums.includes(m2));
  });
}

/* ────────────────────────────── SMALL UI PIECES ────────────────────────────── */

function Field({ field, value, onChange }) {
  const common = {
    id: field.name,
    name: field.name,
    value: value ?? "",
    onChange: (e) => onChange(field.name, e.target.value),
    required: !!field.required,
    className:
      "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
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

function Badge({ children, classes }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>
      {children}
    </span>
  );
}

function CallLink({ number, className }) {
  if (!number) return null;
  return (
    <a
      href={`tel:${number}`}
      onClick={(e) => e.stopPropagation()}
      className={className || "inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {number}
    </a>
  );
}

/* Modal for Call / On-site / Cancel / Site-confirm actions.
   Call + On-site also collect an optional "next meeting date". */
function ActionModal({ modal, onCancel, onSubmit }) {
  const [text, setText] = useState("");
  const [nextDate, setNextDate] = useState("");

  useEffect(() => {
    if (modal) {
      setText("");
      setNextDate(modal.currentNextDate || "");
    }
  }, [modal]);

  if (!modal) return null;
  const titles = {
    cancel: "Why is this being cancelled?",
    call: "Log a call",
    onsite: "Log on-site visit",
    "site-confirm": "Confirm site",
  };
  const required = modal.action === "cancel";
  const showNextDate = modal.action === "call" || modal.action === "onsite";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-900">{titles[modal.action]}</h3>

        <textarea
          autoFocus
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={required ? "Reason for cancelling…" : "Optional remark…"}
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />

        {showNextDate && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">Next meeting date</label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Close
          </button>
          <button
            disabled={required && !text.trim()}
            onClick={() => onSubmit(text.trim(), showNextDate ? nextDate : undefined)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* Yes/No confirm shown when a mobile number already exists in the system. */
function DuplicateConfirmModal({ open, matchedEntry, onYes, onNo }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onNo}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-900">Number already exists</h3>
        <p className="mt-2 text-sm text-slate-600">
          This mobile number is already saved against{" "}
          <span className="font-medium text-slate-800">{matchedEntry?.name}</span>
          {matchedEntry?.mobile1 ? ` (${matchedEntry.mobile1})` : ""}. Save anyway?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onNo} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            No
          </button>
          <button onClick={onYes} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Yes, save
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButtons({ entry, onAction, onEdit, compact }) {
  const disabled = entry.status === "cancelled";
  const base = `rounded-md font-medium transition ${compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"}`;
  return (
    <div className="flex flex-wrap gap-1.5">
      <button disabled={disabled} onClick={() => onAction(entry.id, "site-confirm")} className={`${base} bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40`}>
        Site Confirm
      </button>
      <button disabled={disabled} onClick={() => onAction(entry.id, "call")} className={`${base} bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40`}>
        Call
      </button>
      <button disabled={disabled} onClick={() => onAction(entry.id, "onsite")} className={`${base} bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40`}>
        On-site
      </button>
      <button disabled={disabled} onClick={() => onAction(entry.id, "cancel")} className={`${base} bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40`}>
        Cancel
      </button>
      {onEdit && (
        <button onClick={() => onEdit(entry)} className={`${base} bg-slate-200 text-slate-700 hover:bg-slate-300`}>
          Edit
        </button>
      )}
    </div>
  );
}

function EntryCard({ entry, onAction, onEdit }) {
  const [open, setOpen] = useState(false);
  const s = STATUS[entry.status];
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge classes={entry.type === "customer" ? "bg-indigo-100 text-indigo-800 ring-indigo-600/20" : "bg-orange-100 text-orange-800 ring-orange-600/20"}>
              {entry.type === "customer" ? "Customer" : "Mistry"}
            </Badge>
            <Badge classes={s.classes}>{s.label}</Badge>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-slate-900">{entry.name || "—"}</h3>
        </div>
        {isDueOrOverdue(entry) && (
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600">
            {entry.nextMeetingDate === todayStr() ? "Due today" : "Overdue"}
          </span>
        )}
      </div>

      <dl className="mt-3 space-y-1 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-1">
          <dt className="font-medium text-slate-500">Mobile:</dt>
          <dd><CallLink number={entry.mobile1} /></dd>
          {entry.mobile2 && (
            <>
              <span>/</span>
              <dd><CallLink number={entry.mobile2} /></dd>
            </>
          )}
        </div>
        {entry.type === "customer" && entry.siteAddress && (
          <div><dt className="inline font-medium text-slate-500">Site: </dt><dd className="inline">{entry.siteAddress}</dd></div>
        )}
        {entry.type === "customer" && (entry.mistryName || entry.architectName) && (
          <div>
            {entry.mistryName && <span><dt className="inline font-medium text-slate-500">Mistry: </dt><dd className="inline">{entry.mistryName}{entry.mistryNumber ? ` (${entry.mistryNumber})` : ""}</dd></span>}
            {entry.mistryName && entry.architectName && "  ·  "}
            {entry.architectName && <span><dt className="inline font-medium text-slate-500">Architect: </dt><dd className="inline">{entry.architectName}{entry.architectNumber ? ` (${entry.architectNumber})` : ""}</dd></span>}
          </div>
        )}
        {entry.nextMeetingDate && (
          <div><dt className="inline font-medium text-slate-500">Next meeting: </dt><dd className="inline">{entry.nextMeetingDate}</dd></div>
        )}
        <div><dt className="inline font-medium text-slate-500">Added by: </dt><dd className="inline">{entry.createdBy.name} ({entry.createdBy.role})</dd></div>
      </dl>

      <div className="mt-3">
        <ActionButtons entry={entry} onAction={onAction} onEdit={onEdit} />
      </div>

      <button onClick={() => setOpen((v) => !v)} className="mt-3 self-start text-xs font-medium text-indigo-600 hover:text-indigo-800">
        {open ? "Hide" : "Show"} history ({entry.history.length})
      </button>

      {open && (
        <ul className="mt-2 space-y-2 border-t border-slate-100 pt-2">
          {entry.history.length === 0 && <li className="text-xs text-slate-400">No activity yet.</li>}
          {entry.history
            .slice()
            .reverse()
            .map((h) => (
              <li key={h.id} className="flex items-start gap-2 text-xs">
                <span className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${HISTORY_DOT[h.type]}`} />
                <div>
                  <span className="font-medium text-slate-700">{HISTORY_LABEL[h.type]}</span>
                  <span className="text-slate-400"> · {h.by.name} ({h.by.role}) · {fmtDateTime(h.at)}</span>
                  {h.text && <p className="mt-0.5 text-slate-600">{h.text}</p>}
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function NotificationPanel({ due, onAction, onEdit, onClose }) {
  return (
    <div className="fixed left-2 right-2 top-16 z-40 max-h-[80vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:left-auto sm:right-4 sm:w-96 sm:max-h-[70vh]">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">Today &amp; overdue meetings</h4>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
      </div>
      {due.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Nothing due. You're clear 🎉</p>}
      <ul className="max-h-80 space-y-2 overflow-y-auto">
        {due.map((entry) => (
          <li key={entry.id} className="rounded-lg border border-slate-100 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">{entry.name}</span>
              <span className="text-[11px] text-red-600">{entry.nextMeetingDate}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
              <span>{entry.type === "customer" ? "Customer" : "Mistry"} · added by {entry.createdBy.name} · </span>
              <CallLink number={entry.mobile1} className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800" />
            </div>
            <div className="mt-2">
              <ActionButtons entry={entry} onAction={onAction} onEdit={onEdit} compact />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Admin-only success rate panel. */
function StatsPanel({ entries }) {
  const customerEntries = entries.filter((e) => e.type === "customer");
  const total = customerEntries.length;
  const confirmed = customerEntries.filter((e) => e.status === "site-confirmed").length;
  const cancelled = customerEntries.filter((e) => e.status === "cancelled").length;
  const overallRate = total ? Math.round((confirmed / total) * 100) : 0;

  const byStaff = useMemo(() => {
    const map = new Map();
    for (const e of customerEntries) {
      const key = e.createdBy.id;
      if (!map.has(key)) map.set(key, { name: e.createdBy.name, total: 0, confirmed: 0 });
      const rec = map.get(key);
      rec.total += 1;
      if (e.status === "site-confirmed") rec.confirmed += 1;
    }
    return Array.from(map.values())
      .map((r) => ({ ...r, rate: r.total ? Math.round((r.confirmed / r.total) * 100) : 0 }))
      .sort((a, b) => b.rate - a.rate);
  }, [customerEntries]);

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-sm font-semibold text-slate-900">Customer success rate</h2>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-slate-50 py-3">
          <p className="text-lg font-bold text-slate-900">{total}</p>
          <p className="text-[11px] text-slate-500">Total customers</p>
        </div>
        <div className="rounded-lg bg-emerald-50 py-3">
          <p className="text-lg font-bold text-emerald-700">{overallRate}%</p>
          <p className="text-[11px] text-slate-500">Site confirmed</p>
        </div>
        <div className="rounded-lg bg-rose-50 py-3">
          <p className="text-lg font-bold text-rose-600">{cancelled}</p>
          <p className="text-[11px] text-slate-500">Cancelled</p>
        </div>
      </div>

      {byStaff.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">By staff</p>
          <ul className="space-y-2">
            {byStaff.map((r) => (
              <li key={r.name} className="flex items-center gap-2 text-xs">
                <span className="w-24 flex-shrink-0 truncate text-slate-700">{r.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${r.rate}%` }} />
                </div>
                <span className="w-10 flex-shrink-0 text-right font-medium text-slate-600">{r.rate}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────── MAIN PAGE ────────────────────────────── */

export default function MembersPage() {
  const { data: session, status: authStatus } = useSession();

  const [demoRole, setDemoRole] = useState("admin");
  const currentUser = session?.user
    ? { id: session.user.id, name: session.user.name || "Me", role: session.user.role || demoRole }
    : { id: "demo-user", name: "Demo User", role: demoRole };

  const [entries, setEntries] = useState([]);
  const [entryType, setEntryType] = useState("customer");
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notifOpen, setNotifOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { entryId, action, currentNextDate }
  const [pendingSubmit, setPendingSubmit] = useState(null); // { newEntry } awaiting duplicate confirmation
  const [dupMatch, setDupMatch] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setEntries(saved);
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const canSeeAll = CAN_SEE_ALL_ROLES.includes(currentUser.role);
  const isAdmin = currentUser.role === "admin";

  const visibleEntries = useMemo(
    () => entries.filter((e) => canSeeAll || e.createdBy.id === currentUser.id),
    [entries, canSeeAll, currentUser.id]
  );

  const dueEntries = useMemo(() => visibleEntries.filter(isDueOrOverdue), [visibleEntries]);

  const filteredEntries = useMemo(() => {
    return visibleEntries
      .filter((e) => (statusFilter === "all" ? true : e.status === statusFilter))
      .filter((e) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          e.name?.toLowerCase().includes(q) ||
          e.mobile1?.includes(q) ||
          e.mobile2?.includes(q) ||
          e.siteAddress?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [visibleEntries, search, statusFilter]);

  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
  }

  function persistNewEntry(newEntry) {
    setEntries((prev) => [newEntry, ...prev]);
    resetForm();
  }

  function persistEditedEntry(id, updatedFields) {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const historyItem = { id: uid(), type: "edit", text: "Details updated", by: currentUser, at: new Date().toISOString() };
        return { ...e, ...updatedFields, history: [...e.history, historyItem] };
      })
    );
    resetForm();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const fields = entryType === "customer" ? CUSTOMER_FIELDS : MISTRY_FIELDS;
    for (const f of fields) {
      if (f.required && !form[f.name]?.trim()) return;
    }

    const dup = findDuplicateMobile(entries, form.mobile1, form.mobile2, editingId);

    if (editingId) {
      const updatedFields = { type: entryType, ...form };
      if (dup) {
        setDupMatch(dup);
        setPendingSubmit({ mode: "edit", id: editingId, updatedFields });
        return;
      }
      persistEditedEntry(editingId, updatedFields);
      return;
    }

    const newEntry = {
      id: uid(),
      type: entryType,
      ...form,
      status: "pending",
      createdBy: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
      createdAt: new Date().toISOString(),
      history: form.remark.trim()
        ? [{ id: uid(), type: "note", text: form.remark.trim(), by: currentUser, at: new Date().toISOString() }]
        : [],
    };

    if (dup) {
      setDupMatch(dup);
      setPendingSubmit({ mode: "create", newEntry });
      return;
    }

    persistNewEntry(newEntry);
  }

  function confirmDuplicateYes() {
    if (!pendingSubmit) return;
    if (pendingSubmit.mode === "create") {
      persistNewEntry(pendingSubmit.newEntry);
    } else {
      persistEditedEntry(pendingSubmit.id, pendingSubmit.updatedFields);
    }
    setPendingSubmit(null);
    setDupMatch(null);
  }

  function confirmDuplicateNo() {
    setPendingSubmit(null);
    setDupMatch(null);
  }

  function startEdit(entry) {
    setEntryType(entry.type);
    setForm({
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
    setEditingId(entry.id);
    setShowForm(true);
    setNotifOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function applyAction(entryId, action, text, nextDate) {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e;
        const historyItem = { id: uid(), type: action, text, by: currentUser, at: new Date().toISOString() };
        const status = action === "cancel" ? "cancelled" : action === "site-confirm" ? "site-confirmed" : e.status;
        const nextMeetingDate = nextDate !== undefined && nextDate !== "" ? nextDate : e.nextMeetingDate;
        return { ...e, status, nextMeetingDate, history: [...e.history, historyItem] };
      })
    );
    setActionModal(null);
  }

  function handleAction(entryId, action) {
    const entry = entries.find((e) => e.id === entryId);
    setActionModal({ entryId, action, currentNextDate: entry?.nextMeetingDate || "" });
  }

  const fields = entryType === "customer" ? CUSTOMER_FIELDS : MISTRY_FIELDS;

  if (authStatus === "loading") {
    return <div className="p-8 text-center text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Customers &amp; Mistry</h1>
            <p className="text-xs text-slate-500">
              Signed in as <span className="font-medium">{currentUser.name}</span> · <span className="capitalize">{currentUser.role}</span>
              {canSeeAll ? " · viewing all entries" : " · viewing your entries only"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {SHOW_ROLE_SWITCHER && !session?.user && (
              <select
                value={demoRole}
                onChange={(e) => setDemoRole(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                title="Demo only: preview as a role"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>Viewing as: {r}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-full border border-slate-200 bg-white p-2 hover:bg-slate-50"
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 17a3 3 0 0 0 6 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {dueEntries.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {dueEntries.length}
                </span>
              )}
            </button>

            <button
              onClick={() => (showForm ? resetForm() : setShowForm(true))}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 sm:text-sm"
            >
              {showForm ? "Close form" : "+ Add entry"}
            </button>
          </div>
        </div>
      </header>

      {notifOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
          <NotificationPanel due={dueEntries} onAction={handleAction} onEdit={startEdit} onClose={() => setNotifOpen(false)} />
        </>
      )}

      <main className="mx-auto max-w-6xl px-4 py-5">
        {isAdmin && <StatsPanel entries={entries} />}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xs">
                <label className="mb-1 block text-xs font-medium text-slate-600">Entry type</label>
                <select
                  value={entryType}
                  disabled={!!editingId}
                  onChange={(e) => {
                    setEntryType(e.target.value);
                    setForm(EMPTY_FORM);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-100"
                >
                  <option value="customer">Customer</option>
                  <option value="mistry">Mistry</option>
                </select>
              </div>
              {editingId && <span className="text-xs font-medium text-amber-600">Editing existing entry</span>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <Field key={f.name} field={f} value={form[f.name]} onChange={updateField} />
              ))}

              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Next meeting date</label>
                <input
                  type="date"
                  value={form.nextMeetingDate}
                  onChange={(e) => updateField("nextMeetingDate", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Remark</label>
                <textarea
                  rows={2}
                  value={form.remark}
                  onChange={(e) => updateField("remark", e.target.value)}
                  placeholder="Any note about this entry…"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                {editingId ? "Save changes" : `Save ${entryType === "customer" ? "customer" : "mistry"}`}
              </button>
            </div>
          </form>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, mobile, address…"
            className="min-w-[180px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="site-confirmed">Site Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {filteredEntries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-400">
            No entries yet. Tap "+ Add entry" to create one.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onAction={handleAction} onEdit={startEdit} />
            ))}
          </div>
        )}
      </main>

      <ActionModal
        modal={actionModal}
        onCancel={() => setActionModal(null)}
        onSubmit={(text, nextDate) => applyAction(actionModal.entryId, actionModal.action, text, nextDate)}
      />

      <DuplicateConfirmModal
        open={!!pendingSubmit}
        matchedEntry={dupMatch}
        onYes={confirmDuplicateYes}
        onNo={confirmDuplicateNo}
      />
    </div>
  );
}