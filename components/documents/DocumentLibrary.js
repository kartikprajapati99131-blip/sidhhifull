"use client";

import { useMemo, useState } from "react";
import { Download, Eye, FileText, Search, Inbox } from "lucide-react";
import PdfPreviewModal from "./PdfPreviewModal";
import { formatDate, formatSize } from "@/lib/pdfFormat";

export default function DocumentLibrary({ docs }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return docs;
    return docs.filter((d) => `${d.title} ${d.description}`.toLowerCase().includes(s));
  }, [docs, query]);

  return (
    <>
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          aria-label="Search documents"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or description"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>

      {docs.length === 0 ? (
        <Empty text="No documents have been published yet." />
      ) : filtered.length === 0 ? (
        <Empty text={`Nothing matches “${query}”. Try a different word.`} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((d) => (
            <li
              key={d.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <FileText className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-slate-900 [overflow-wrap:anywhere]">{d.title}</h2>
                {d.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600 [overflow-wrap:anywhere]">{d.description}</p>
                )}
                <p className="mt-1.5 text-xs text-slate-500">
                  PDF · {formatSize(d.size)} · Added {formatDate(d.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setActive(d)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Eye className="h-4 w-4" /> Preview
                </button>
                <a
                  href={`/api/documents/${d.id}/file?download=1`}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {active && <PdfPreviewModal doc={active} onClose={() => setActive(null)} />}
    </>
  );
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <Inbox className="mx-auto mb-3 h-8 w-8 text-slate-300" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
