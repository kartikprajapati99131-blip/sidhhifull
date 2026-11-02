"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, Copy, Eye, EyeOff, FileText, Globe, Loader2,
  Pencil, Search, Trash2, Upload, X,
} from "lucide-react";
import { CHUNK_SIZE, MAX_DESCRIPTION, MAX_PDF_BYTES, MAX_TITLE } from "@/lib/pdfConfig";
import { formatDate, formatSize } from "@/lib/pdfFormat";

const MAX_MB = MAX_PDF_BYTES / 1024 / 1024;

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";

/* ───────────── chunked upload helpers ───────────── */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const abortError = () => new DOMException("Upload cancelled", "AbortError");

// One piece = one PUT request (XHR gives us smooth progress)
function putChunk(url, blob, onProgress, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = "";
      try { message = JSON.parse(xhr.responseText).message; } catch {}
      const err = new Error(message || `Upload failed (${xhr.status})`);
      err.status = xhr.status;
      reject(err);
    };
    xhr.onerror = () => reject(Object.assign(new Error("Network problem. Check your connection."), { network: true }));
    xhr.ontimeout = xhr.onerror;
    xhr.onabort = () => reject(abortError());
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(blob);
  });
}

async function putChunkWithRetry(url, blob, onProgress, signal) {
  const attempts = 4;
  for (let i = 1; ; i++) {
    try {
      return await putChunk(url, blob, onProgress, signal);
    } catch (err) {
      const retryable = err.network || err.status >= 500;
      if (err.name === "AbortError" || !retryable || i >= attempts) throw err;
      onProgress(0);
      await sleep(800 * i);
    }
  }
}

async function readJson(res) {
  try { return await res.json(); } catch { return {}; }
}

/* ───────────── page ───────────── */

export default function DocumentManager() {
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/documents?scope=admin", { cache: "no-store" });
      const json = await readJson(res);
      if (!res.ok || !json.success) throw new Error(json.message || "Could not load documents.");
      setItems(json.data);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message || "Could not load documents.");
      setItems((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = (items || []).filter((d) =>
    `${d.title} ${d.description}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">PDF documents</h1>
          <p className="mt-1 text-sm text-slate-600">Upload files and choose what clients can see.</p>
        </div>
        <Link href="/documents" target="_blank" className={ghostBtn}>
          <Globe className="h-4 w-4" /> View public page
        </Link>
      </div>

      <UploadForm onUploaded={load} />

      <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Uploaded files {items && <span className="font-normal text-slate-500">({items.length})</span>}
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Search uploaded files"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={`${inputCls} pl-9`}
          />
        </div>
      </div>

      {loadError && <p role="alert" className="mb-3 text-sm text-red-700">{loadError}</p>}

      {items === null ? (
        <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No files yet. Upload your first PDF above.
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No uploaded file matches your search.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((it) => (
            <Row key={it.id} item={it} onChanged={load} />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────────── upload ───────────── */

function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  function pick(f) {
    setError("");
    setDone("");
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf"))
      return setError("Only PDF files are allowed.");
    if (f.size === 0) return setError("This file is empty.");
    if (f.size > MAX_PDF_BYTES)
      return setError(`This file is ${formatSize(f.size)}. The limit is ${MAX_MB} MB.`);
    setFile(f);
    setTitle((t) => t || f.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim().slice(0, MAX_TITLE));
  }

  function reset() {
    setFile(null);
    setTitle("");
    setDescription("");
    setPublished(true);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (!file) return setError("Choose a PDF file first.");
    if (!title.trim()) return setError("Add a title.");

    setBusy(true);
    setError("");
    setDone("");
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;
    let docId = null;

    try {
      // 1) create the record
      const startRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          published,
          fileName: file.name,
          size: file.size,
        }),
        signal: controller.signal,
      });
      const start = await readJson(startRes);
      if (!startRes.ok || !start.success) throw new Error(start.message || "Could not start the upload.");
      docId = start.data.id;
      const { chunkCount } = start.data;
      const chunkSize = start.data.chunkSize || CHUNK_SIZE;

      // 2) send the file piece by piece
      for (let i = 0; i < chunkCount; i++) {
        const blob = file.slice(i * chunkSize, Math.min((i + 1) * chunkSize, file.size));
        const sentBefore = i * chunkSize;
        await putChunkWithRetry(
          `/api/documents/${docId}/chunk?index=${i}`,
          blob,
          (loaded) => setProgress(Math.min(99, Math.round(((sentBefore + loaded) / file.size) * 100))),
          controller.signal
        );
      }

      // 3) verify and publish
      const endRes = await fetch(`/api/documents/${docId}/complete`, { method: "POST", signal: controller.signal });
      const end = await readJson(endRes);
      if (!endRes.ok || !end.success) throw new Error(end.message || "Could not finish the upload.");

      setProgress(100);
      setDone(`“${title.trim()}” uploaded.`);
      reset();
      onUploaded();
    } catch (err) {
      if (docId) fetch(`/api/documents/${docId}`, { method: "DELETE" }).catch(() => {}); // remove half-uploaded data
      setProgress(0);
      setError(err.name === "AbortError" ? "Upload cancelled." : err.message || "Upload failed. Try again.");
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  // Warn before closing the tab in the middle of an upload
  useEffect(() => {
    if (!busy) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Upload a PDF</h2>

      <div
        onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) pick(e.dataTransfer.files?.[0]); }}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300"
        }`}
      >
        {file ? (
          <p className="flex items-center justify-center gap-2 text-sm text-slate-800">
            <FileText className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-medium [overflow-wrap:anywhere]">{file.name}</span>
            <span className="shrink-0 text-slate-500">{formatSize(file.size)}</span>
          </p>
        ) : (
          <p className="text-sm text-slate-600">Drag a PDF here, or</p>
        )}
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={`${ghostBtn} mt-3`}>
          <Upload className="h-4 w-4" /> {file ? "Choose a different file" : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <p className="mt-2 text-xs text-slate-500">PDF only · up to {MAX_MB} MB</p>
      </div>

      <div>
        <label htmlFor="pdf-title" className="mb-1 block text-sm font-medium text-slate-700">Title</label>
        <input id="pdf-title" maxLength={MAX_TITLE} value={title} disabled={busy}
          onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Plywood price list 2026" />
      </div>
      <div>
        <label htmlFor="pdf-desc" className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea id="pdf-desc" rows={3} maxLength={MAX_DESCRIPTION} value={description} disabled={busy}
          onChange={(e) => setDescription(e.target.value)} className={inputCls}
          placeholder="What is inside this document?" />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={published} disabled={busy} onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
        Show to clients right away
      </label>

      {busy && (
        <div aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Uploading… {progress}%. Keep this page open.</p>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {done && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {done}
        </p>
      )}

      <div className="flex gap-2">
        <button className={primaryBtn} disabled={busy || !file}>
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload PDF</>}
        </button>
        {busy && (
          <button type="button" onClick={() => abortRef.current?.abort()} className={ghostBtn}>
            <X className="h-4 w-4" /> Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/* ───────────── one uploaded file ───────────── */

function Row({ item, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function call(method, body) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/documents/${item.id}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await readJson(res);
      if (!res.ok || !json.success) throw new Error(json.message || "Something went wrong.");
      await onChanged();
      return true;
    } catch (err) {
      setError(err.message || "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!title.trim()) return setError("Title cannot be empty.");
    if (await call("PATCH", { title, description })) setEditing(false);
  }

  function remove() {
    if (window.confirm(`Delete “${item.title}”? The file will be removed permanently.`)) call("DELETE");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/api/documents/${item.id}/file`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the link. Copy it from the preview tab instead.");
    }
  }

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {editing ? (
        <div className="space-y-3">
          <input value={title} maxLength={MAX_TITLE} aria-label="Title" onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <textarea value={description} rows={3} maxLength={MAX_DESCRIPTION} aria-label="Description"
            onChange={(e) => setDescription(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <button onClick={save} disabled={busy} className={primaryBtn}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
            </button>
            <button
              onClick={() => { setEditing(false); setTitle(item.title); setDescription(item.description); setError(""); }}
              className={ghostBtn}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900 [overflow-wrap:anywhere]">{item.title}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {item.published ? "Visible to clients" : "Hidden"}
                </span>
              </div>
              {item.description && <p className="mt-1 text-sm text-slate-600 [overflow-wrap:anywhere]">{item.description}</p>}
              <p className="mt-1.5 text-xs text-slate-500">
                {formatSize(item.size)} · {item.downloads} download{item.downloads === 1 ? "" : "s"} · Added {formatDate(item.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <a href={`/api/documents/${item.id}/file`} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
              <Eye className="h-4 w-4" /> Preview
            </a>
            <button onClick={copyLink} className={ghostBtn}>
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button onClick={() => setEditing(true)} className={ghostBtn}><Pencil className="h-4 w-4" /> Edit</button>
            <button onClick={() => call("PATCH", { published: !item.published })} disabled={busy} className={ghostBtn}>
              {item.published ? <><EyeOff className="h-4 w-4" /> Hide</> : <><Globe className="h-4 w-4" /> Show</>}
            </button>
            <button onClick={remove} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </li>
  );
}
