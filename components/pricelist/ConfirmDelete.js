// components/pricelist/ConfirmDelete.jsx
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * One consistent "delete with confirm" control, used everywhere instead of
 * each component reinventing its own confirm/cancel pair.
 *
 * Props
 * ─────
 * onConfirm : () => void | Promise<void>
 */
export default function ConfirmDelete({ onConfirm }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (confirming) {
    return (
      <span className="flex items-center gap-1 text-xs whitespace-nowrap">
        <span className="text-slate-500">Delete?</span>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            setBusy(true);
            await onConfirm();
            setBusy(false);
            setConfirming(false);
          }}
          disabled={busy}
          className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-60"
        >
          {busy ? "…" : "Yes"}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
          disabled={busy}
          className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
      title="Delete"
      aria-label="Delete"
      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
    >
      <Trash2 size={14} />
    </button>
  );
}