"use client";

import { ListChecks, Clock, Download, Pencil, Trash2 } from "lucide-react";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  draft: "bg-amber-50 text-amber-700 ring-amber-600/20",
  archived: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export default function PolicyCard({ policy, onView, onEdit, onDelete, onExport, canManage = true }) {
  const statusClass = STATUS_STYLES[policy.status] || STATUS_STYLES.active;

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md"
          style={{
            backgroundColor: `${policy.category?.color || "#6366f1"}14`,
            color: policy.category?.color || "#6366f1",
          }}
        >
          {policy.category?.name || "Uncategorized"}
        </span>
        <span className={`text-[11px] font-medium px-2 py-1 rounded-full ring-1 ring-inset ${statusClass}`}>
          {policy.status}
        </span>
      </div>

      <button onClick={() => onView(policy)} className="text-left">
        <h3 className="font-semibold text-slate-900 leading-snug mb-1.5 hover:text-indigo-600 transition-colors">
          {policy.title}
        </h3>
      </button>

      {policy.description && (
        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{policy.description}</p>
      )}

      <div className="mt-auto pt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
        <span className="flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5" />
          {policy.rules?.length || 0} rules
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {new Date(policy.updatedAt).toLocaleDateString()}
        </span>
        <span className="font-medium text-slate-500">v{policy.version}</span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onExport(policy)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg py-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          PDF
        </button>
        {canManage && (
          <>
            <button
              onClick={() => onEdit(policy)}
              className="flex items-center justify-center text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg py-1.5 px-3 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(policy)}
              className="flex items-center justify-center text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg py-1.5 px-3 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
