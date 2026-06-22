"use client";

import { useState, useEffect, useCallback } from "react";

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
      className={`fixed bottom-5 right-5 z-[110] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all ${
        isError ? "bg-red-600" : "bg-emerald-600"
      }`}
      role="status"
    >
      {toast.message}
    </div>
  );
}

export default function DueReminderPopup() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Edit modal state
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    amount: "",
    dueDate: "",
    note: "",
  });

  // "Done Calling" follow up modal state
  const [followUpEntry, setFollowUpEntry] = useState(null);
  const [followUpDate, setFollowUpDate] = useState("");

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
        if (data.data.length > 0) {
          setVisible(true);
        }
      } else {
        showToast(data.message || "Failed to load today's due payments", "error");
      }
    } catch (error) {
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
      if (next.length === 0) {
        setVisible(false);
      }
      return next;
    });
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

  const closeEditModal = () => {
    setEditingEntry(null);
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

        // If the edited due date is no longer today/overdue, drop it from the popup.
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
    } catch (error) {
      showToast("Something went wrong while updating entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- Done Calling -> follow up -----
  const openFollowUpModal = (entry) => {
    setFollowUpEntry(entry);
    setFollowUpDate("");
  };

  const closeFollowUpModal = () => {
    setFollowUpEntry(null);
    setFollowUpDate("");
  };

  const handleFollowUpSave = async (e) => {
    e.preventDefault();
    if (!followUpEntry) return;

    if (!followUpDate) {
      showToast("Please select the next follow up date", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/due-payments/${followUpEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isFollowUp: true,
          dueDate: followUpDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Follow up date saved");
        removeFromList(followUpEntry._id);
        closeFollowUpModal();
      } else {
        showToast(data.message || "Failed to save follow up date", "error");
      }
    } catch (error) {
      showToast("Something went wrong while saving follow up date", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !visible || entries.length === 0) {
    return <Toast toast={toast} />;
  }

  return (
    <>
      <Toast toast={toast} />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Today&apos;s Due Payments
              </h2>
              <p className="text-xs text-slate-500">
                {entries.length} payment{entries.length > 1 ? "s" : ""} need attention
              </p>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry._id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {entry.customerName}
                    </p>
                    <p className="text-sm text-slate-600">
                      ₹{Number(entry.amount).toLocaleString("en-IN")} &middot; Due{" "}
                      {formatDate(entry.dueDate)}
                    </p>
                    {entry.mobile && (
                      <p className="text-xs text-slate-500">{entry.mobile}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(entry)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openFollowUpModal(entry)}
                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                      Done Calling
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-slate-800">
              Edit Due Payment
            </h3>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={editForm.customerName}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={editForm.amount}
                  onChange={handleEditChange}
                  min="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={editForm.dueDate}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Note
                </label>
                <textarea
                  name="note"
                  value={editForm.note}
                  onChange={handleEditChange}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Done Calling -> Next Follow Up Date Modal */}
      {followUpEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-1 text-base font-semibold text-slate-800">
              Schedule Next Follow Up
            </h3>
            <p className="mb-4 text-sm text-slate-600">
              {followUpEntry.customerName} &middot; ₹
              {Number(followUpEntry.amount).toLocaleString("en-IN")}
            </p>
            <form onSubmit={handleFollowUpSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Next Follow Up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeFollowUpModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
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