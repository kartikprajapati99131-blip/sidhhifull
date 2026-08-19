"use client";

import { useState } from "react";
import { X, Download, Pencil, Calendar, History, Loader2 } from "lucide-react";
import { exportPolicyPDF } from "@/utils/policyPdfExport";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  draft: "bg-amber-50 text-amber-700 ring-amber-600/20",
  archived: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export default function PolicyDetailModal({ policy, onClose, onEdit }) {
  const [exporting, setExporting] = useState(false);
  const statusClass = STATUS_STYLES[policy.status] || STATUS_STYLES.active;

  async function handleExport() {
    setExporting(true);
    try {
      await exportPolicyPDF(policy);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-xl flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className="text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md"
                style={{
                  backgroundColor: `${policy.category?.color || "#6366f1"}14`,
                  color: policy.category?.color || "#6366f1",
                }}
              >
                {policy.category?.name || "Uncategorized"}
              </span>
              <h2 className="text-xl font-semibold text-slate-900 mt-2">{policy.title}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {policy.description && (
            <p className="text-sm text-slate-500 mt-2">{policy.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
            <span className={`font-medium px-2 py-1 rounded-full ring-1 ring-inset ${statusClass}`}>
              {policy.status}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Effective {new Date(policy.effectiveDate).toLocaleDateString()}
            </span>
            <span>Version {policy.version}</span>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Rules ({policy.rules?.length || 0})
          </h3>
          <ol className="space-y-2.5">
            {policy.rules
              ?.slice()
              .sort((a, b) => a.order - b.order)
              .map((rule, idx) => (
                <li key={rule._id || idx} className="flex gap-3 text-sm text-slate-700">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5">{rule.text}</span>
                </li>
              ))}
          </ol>

          {policy.history?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Recent Activity
              </h3>
              <ul className="space-y-1.5">
                {policy.history
                  .slice(-3)
                  .reverse()
                  .map((h, idx) => (
                    <li key={idx} className="text-xs text-slate-400">
                      <span className="capitalize font-medium text-slate-500">{h.action}</span>
                      {h.changedBy ? ` by ${h.changedBy}` : ""} —{" "}
                      {new Date(h.changedAt).toLocaleString()}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export PDF
          </button>
          <button
            onClick={() => onEdit(policy)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Policy
          </button>
        </div>
      </div>
    </div>
  );
}
