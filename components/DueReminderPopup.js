"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-5 right-5 z-[110] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all ${isError ? "bg-red-600" : "bg-emerald-600"}`}
      role="status"
    >
      {toast.message}
    </div>
  );
}

const WA_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const DEFAULT_TEMPLATE =
  "Hi {name}, this is a reminder that ₹{amount} is due. Please arrange payment at your earliest convenience. Thank you!";

// ── WhatsApp step-through sender for due-payment reminders ──────────────────
function WhatsAppReminderSender({ entries }) {
  const [msgTemplate, setMsgTemplate] = useState(DEFAULT_TEMPLATE);
  const [showCustomise, setShowCustomise] = useState(false);
  const [copied, setCopied] = useState(false);
  const [senderOpen, setSenderOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [sentSet, setSentSet] = useState(new Set());

  const withMobile = entries.filter((e) => e.mobile);

  function buildMsg(entry) {
    return msgTemplate
      .replace(/\{name\}/gi, entry.customerName)
      .replace(/\{amount\}/gi, Number(entry.amount).toLocaleString("en-IN"));
  }

  function startSender() {
    setStepIdx(0);
    setSentSet(new Set());
    setSenderOpen(true);
  }

  function goNext() {
    if (stepIdx < withMobile.length - 1) setStepIdx((i) => i + 1);
    else setSenderOpen(false);
  }

  function goPrev() {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }

  function copyNumbers() {
    const text = withMobile.map((e) => `${e.customerName}: +91${e.mobile}`).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyMessages() {
    const text = withMobile.map((e) => `+91${e.mobile}\n${buildMsg(e)}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!withMobile.length) return null;

  const current = withMobile[stepIdx];
  const allDone = sentSet.size === withMobile.length;

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
      {/* Template row */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            WhatsApp Message Template
          </p>
          <button
            onClick={() => setShowCustomise((s) => !s)}
            className="text-xs font-medium text-sky-500 transition hover:text-sky-700"
          >
            {showCustomise ? "Done" : "Customise"}
          </button>
        </div>
        {showCustomise ? (
          <textarea
            value={msgTemplate}
            onChange={(e) => setMsgTemplate(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        ) : (
          <p className="truncate rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-400">
            {msgTemplate}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          Use <code className="rounded bg-slate-100 px-1">{"{name}"}</code> and{" "}
          <code className="rounded bg-slate-100 px-1">{"{amount}"}</code> — replaced per entry
        </p>
      </div>

      {/* Step-through sender */}
      {senderOpen && (
        <div className="mb-3 overflow-hidden rounded-xl border border-green-200 bg-green-50">
          <div className="h-1 bg-green-100">
            <div
              className="h-1 bg-green-400 transition-all duration-300"
              style={{ width: `${((stepIdx + 1) / withMobile.length) * 100}%` }}
            />
          </div>

          <div className="px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Step-by-Step Sender
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-green-600">
                  {stepIdx + 1} / {withMobile.length}
                </span>
                <button
                  onClick={() => setSenderOpen(false)}
                  className="text-lg leading-none text-green-400 hover:text-green-700"
                >
                  ×
                </button>
              </div>
            </div>

            {allDone ? (
              <div className="py-3 text-center">
                <p className="mb-1 text-2xl">🎉</p>
                <p className="text-sm font-semibold text-green-700">
                  All {withMobile.length} messages sent!
                </p>
                <button
                  onClick={() => setSenderOpen(false)}
                  className="mt-3 rounded-lg bg-green-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-green-600"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 rounded-lg border border-green-100 bg-white px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-800">
                    {sentSet.has(stepIdx) && <span className="mr-1 text-green-500">✓</span>}
                    {current.customerName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    +91 {current.mobile} &middot; ₹{Number(current.amount).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1.5 text-xs italic text-slate-500">"{buildMsg(current)}"</p>
                </div>

                <div className="mb-3 flex flex-wrap justify-center gap-1">
                  {withMobile.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStepIdx(i)}
                      className={`h-2 w-2 rounded-full transition ${
                        i === stepIdx
                          ? "w-4 bg-green-500"
                          : sentSet.has(i)
                          ? "bg-green-300"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={goPrev}
                    disabled={stepIdx === 0}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
                  >
                    ← Prev
                  </button>

                  <a
                    href={`https://wa.me/91${current.mobile}?text=${encodeURIComponent(buildMsg(current))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSentSet((prev) => new Set([...prev, stepIdx]))}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-green-600"
                  >
                    {WA_ICON}
                    {sentSet.has(stepIdx) ? "Open Again" : "Open WhatsApp"}
                  </a>

                  <button
                    onClick={goNext}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    {stepIdx === withMobile.length - 1 ? "Finish" : "Next →"}
                  </button>
                </div>

                {!sentSet.has(stepIdx) && (
                  <p className="mt-2 text-center text-xs text-green-600">
                    Click "Open WhatsApp" → send the message → come back → click Next →
                  </p>
                )}
                {sentSet.has(stepIdx) && stepIdx < withMobile.length - 1 && (
                  <p className="mt-2 text-center text-xs text-green-600">
                    ✓ Opened — click Next → when you've sent it
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {!senderOpen && (
          <button
            onClick={startSender}
            className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600"
          >
            {WA_ICON}
            Send All ({withMobile.length}) — Step by Step
          </button>
        )}

        <div className="flex flex-wrap gap-1.5">
          {withMobile.map((e, i) => (
            <a
              key={e._id}
              href={`https://wa.me/91${e.mobile}?text=${encodeURIComponent(buildMsg(e))}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSentSet((prev) => new Set([...prev, i]))}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                sentSet.has(i)
                  ? "border-green-300 bg-green-100 text-green-700"
                  : "border-green-200 bg-white text-green-700 hover:bg-green-50"
              }`}
            >
              {sentSet.has(i) ? "✓ " : ""}
              {e.customerName}
            </a>
          ))}
        </div>

        <div className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:block" />

        <button
          onClick={copyNumbers}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          📋 Copy Numbers
        </button>
        <button
          onClick={copyMessages}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          📝 Copy Messages
        </button>
        {copied && <span className="text-xs font-semibold text-emerald-600">✓ Copied!</span>}
      </div>
    </div>
  );
}

export default function DueReminderPopup() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    amount: "",
    dueDate: "",
    note: "",
  });

  const [followUpEntry, setFollowUpEntry] = useState(null);
  const [followUpDate, setFollowUpDate] = useState("");

  const [onsiteEntry, setOnsiteEntry] = useState(null);
  const [onsiteDate, setOnsiteDate] = useState("");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchTodayEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/due-payments/today");
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
        if (data.data.length > 0) setVisible(true);
      } else {
        showToast(data.message || "Failed to load today's due payments", "error");
      }
    } catch {
      showToast("Something went wrong while loading reminders", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTodayEntries();
  }, [fetchTodayEntries]);

  const removeFromList = (id) => {
    setEntries((prev) => {
      const next = prev.filter((entry) => entry._id !== id);
      if (next.length === 0) setVisible(false);
      return next;
    });
  };

  // ---- Export PDF ----
  const handleExportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const totalAmount = entries.reduce((sum, e) => sum + Number(e.amount), 0);

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("Due Payment Reminders", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${today}`, 14, 21);

    doc.setFillColor(238, 242, 255);
    doc.roundedRect(14, 33, 182, 16, 3, 3, "F");
    doc.setFontSize(9);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Entries: ${entries.length}`, 20, 42);
    doc.text(
      `Total Amount Due: Rs.${totalAmount.toLocaleString("en-IN")}`,
      90,
      42
    );

    autoTable(doc, {
      startY: 55,
      head: [["#", "Customer Name", "Mobile", "Amount (Rs.)", "Due Date", "Note"]],
      body: entries.map((entry, i) => [
        i + 1,
        entry.customerName,
        entry.mobile || "-",
        Number(entry.amount).toLocaleString("en-IN"),
        formatDate(entry.dueDate),
        entry.note || "-",
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
        halign: "left",
      },
      alternateRowStyles: {
        fillColor: [238, 242, 255],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        3: { halign: "right" },
        4: { halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 8,
        { align: "center" }
      );
    }

    doc.save(`due-payments-${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast("PDF exported successfully");
  };

  // ----- Edit -----
  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      customerName: entry.customerName,
      amount: entry.amount,
      dueDate: entry.dueDate ? entry.dueDate.slice(0, 10) : "",
      note: entry.note || "",
    });
  };
  const closeEditModal = () => setEditingEntry(null);
  const handleEditChange = (e) =>
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    if (!editForm.customerName.trim() || !editForm.amount || !editForm.dueDate) {
      showToast("Name, amount and due date are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/due-payments/${editingEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editForm.customerName,
          amount: editForm.amount,
          dueDate: editForm.dueDate,
          note: editForm.note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Entry updated successfully");
        closeEditModal();
        const newDueDate = new Date(editForm.dueDate);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        if (newDueDate > endOfToday) {
          removeFromList(editingEntry._id);
        } else {
          setEntries((prev) =>
            prev.map((entry) =>
              entry._id === editingEntry._id ? { ...entry, ...data.data } : entry
            )
          );
        }
      } else {
        showToast(data.message || "Failed to update entry", "error");
      }
    } catch {
      showToast("Something went wrong while updating entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- Follow Up (call reschedule) -----
  const openFollowUpModal = (entry) => { setFollowUpEntry(entry); setFollowUpDate(""); };
  const closeFollowUpModal = () => { setFollowUpEntry(null); setFollowUpDate(""); };

  const handleFollowUpSave = async (e) => {
    e.preventDefault();
    if (!followUpEntry) return;
    if (!followUpDate) { showToast("Please select the next follow up date", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/due-payments/${followUpEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFollowUp: true, dueDate: followUpDate }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Follow up date saved");
        removeFromList(followUpEntry._id);
        closeFollowUpModal();
      } else {
        showToast(data.message || "Failed to save follow up date", "error");
      }
    } catch {
      showToast("Something went wrong while saving follow up date", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- On-site Reschedule -----
  const openOnsiteModal = (entry) => { setOnsiteEntry(entry); setOnsiteDate(""); };
  const closeOnsiteModal = () => { setOnsiteEntry(null); setOnsiteDate(""); };

  const handleOnsiteSave = async (e) => {
    e.preventDefault();
    if (!onsiteEntry) return;
    if (!onsiteDate) { showToast("Please select the new due date", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/due-payments/${onsiteEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnsiteReschedule: true, dueDate: onsiteDate }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Rescheduled on-site");
        removeFromList(onsiteEntry._id);
        closeOnsiteModal();
      } else {
        showToast(data.message || "Failed to reschedule", "error");
      }
    } catch {
      showToast("Something went wrong while rescheduling", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !visible || entries.length === 0) return <Toast toast={toast} />;

  return (
    <>
      <Toast toast={toast} />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Today&apos;s Due Reminders
              </h2>
              <p className="text-xs text-slate-500">
                {entries.length} payment{entries.length > 1 ? "s" : ""} need attention
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 rounded-md bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export PDF
                </button>
              )}
              <button
                onClick={() => setVisible(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Entries list */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry._id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{entry.customerName}</p>
                    <p className="text-sm text-slate-600">
                      {Number(entry.amount).toLocaleString("en-IN")} &middot; Due {formatDate(entry.dueDate)}
                    </p>
                    {entry.mobile && (
                      <p className="text-xs text-slate-500">{entry.mobile}</p>
                    )}
                    {entry.referencedBy && (
                      <span className="mt-1 inline-block rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                        {entry.referencedBy}
                      </span>
                    )}
                    {entry.note && (
                      <p className="mt-1 text-xs italic text-slate-500">{entry.note}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openEditModal(entry)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <a href={`tel:${entry.mobile}`}>
                      <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                        Call
                      </button>
                    </a>
                    <button
                      onClick={() => openFollowUpModal(entry)}
                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                      Done Calling
                    </button>
                    <button
                      onClick={() => openOnsiteModal(entry)}
                      className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                    >
                      On-site
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── WhatsApp reminder sender ── */}
          {isAdmin && <WhatsAppReminderSender entries={entries} />}
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Due Payment</h3>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Customer Name</label>
                <input type="text" name="customerName" value={editForm.customerName} onChange={handleEditChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Amount (₹)</label>
                <input type="number" name="amount" value={editForm.amount} onChange={handleEditChange} min="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Due Date</label>
                <input type="date" name="dueDate" value={editForm.dueDate} onChange={handleEditChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Note</label>
                <textarea name="note" value={editForm.note} onChange={handleEditChange} rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeEditModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow Up Modal (call reschedule) */}
      {followUpEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-1 text-base font-semibold text-slate-800">Schedule Next Follow Up</h3>
            <p className="mb-4 text-sm text-slate-600">
              {followUpEntry.customerName} &middot; ₹{Number(followUpEntry.amount).toLocaleString("en-IN")}
            </p>
            <form onSubmit={handleFollowUpSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Next Follow Up Date</label>
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeFollowUpModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* On-site Reschedule Modal */}
      {onsiteEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-1 text-base font-semibold text-slate-800">On-site Reschedule</h3>
            <p className="mb-4 text-sm text-slate-600">
              {onsiteEntry.customerName} &middot; ₹{Number(onsiteEntry.amount).toLocaleString("en-IN")}
            </p>
            <form onSubmit={handleOnsiteSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">New Due Date</label>
                <input type="date" value={onsiteDate} onChange={(e) => setOnsiteDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeOnsiteModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60">
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}