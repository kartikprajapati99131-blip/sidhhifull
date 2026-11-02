"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Loader2, X } from "lucide-react";

export default function PdfPreviewModal({ doc, onClose }) {
  const closeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const src = `/api/documents/${doc.id}/file`;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // no page scroll behind the modal
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${doc.title}`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[92vh] sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{doc.title}</h2>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Open in new tab</span>
          </a>
          <a
            href={`${src}?download=1`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" /> Download
          </a>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-slate-100">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          <iframe
            title={doc.title}
            src={src}
            onLoad={() => setLoading(false)}
            className="h-full w-full"
          />
        </div>

        {/* Some phone browsers cannot show a PDF inside a page */}
        <p className="border-t border-slate-200 px-4 py-2 text-center text-xs text-slate-500 sm:hidden">
          Preview empty? Tap “Open in new tab” or Download.
        </p>
      </div>
    </div>
  );
}
