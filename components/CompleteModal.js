"use client";

import { useState } from "react";

// Today's date as "YYYY-MM-DD", used as the min for the reschedule date input.
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CompleteModal({ entry, onClose, onSuccess, showToast }) {
  const [paymentMethod, setPaymentMethod] = useState(""); // "cash" | "check"
  const [amountGiven, setAmountGiven] = useState("");
  const [accountStatus, setAccountStatus] = useState(""); // "closed" | "continue"
  const [newDueDate, setNewDueDate] = useState(""); // reschedule date when continuing
  const [submitting, setSubmitting] = useState(false);

  if (!entry) return null;

  const totalAmount = Number(entry.amount);
  const given = Number(amountGiven) || 0;
  const remaining = totalAmount - given;

  const isValid =
    paymentMethod &&
    amountGiven !== "" &&
    given >= 0 &&
    given <= totalAmount &&
    accountStatus &&
    (accountStatus !== "continue" || Boolean(newDueDate));

  const handleSubmit = async () => {
    if (!isValid) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/due-payments/${entry._id}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          amountGiven: given,
          accountStatus,
          remainingAmount: accountStatus === "continue" ? remaining : 0,
          newDueDate: accountStatus === "continue" ? newDueDate : undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(
          accountStatus === "closed"
            ? `✅ Account closed — ₹${given.toLocaleString("en-IN")} collected`
            : `✅ ₹${given.toLocaleString("en-IN")} collected — ₹${remaining.toLocaleString("en-IN")} remaining`
        );
        onSuccess();
      } else {
        showToast(data.message || "Failed to complete payment", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5">
          <h3 className="text-base font-semibold text-slate-800">
            Complete Payment
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {entry.customerName} &mdash; Total due:{" "}
            <span className="font-semibold text-slate-700">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </p>
        </div>

        <div className="space-y-4">
          {/* Payment Method */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">
              Payment Method
            </label>
            <div className="flex gap-3">
              {["cash", "check"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition ${
                    paymentMethod === method
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {method === "cash" ? "💵 Cash" : "🏦 Check"}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Given */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Amount Given (₹)
            </label>
            <input
              type="number"
              value={amountGiven}
              onChange={(e) => setAmountGiven(e.target.value)}
              placeholder={`Max ₹${totalAmount.toLocaleString("en-IN")}`}
              min="0"
              max={totalAmount}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {amountGiven !== "" && given < totalAmount && (
              <p className="mt-1 text-xs text-amber-600">
                Remaining after this payment:{" "}
                <span className="font-semibold">
                  ₹{remaining.toLocaleString("en-IN")}
                </span>
              </p>
            )}
            {amountGiven !== "" && given === totalAmount && (
              <p className="mt-1 text-xs text-emerald-600 font-medium">
                ✓ Full amount collected
              </p>
            )}
            {amountGiven !== "" && given > totalAmount && (
              <p className="mt-1 text-xs text-red-600">
                Amount cannot exceed ₹{totalAmount.toLocaleString("en-IN")}
              </p>
            )}
          </div>

          {/* Account Status */}
          {amountGiven !== "" && given >= 0 && given <= totalAmount && (
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600">
                Account Status
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setAccountStatus("closed"); setNewDueDate(""); }}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                    accountStatus === "closed"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  ✅ Account Closed
                </button>
                <button
                  type="button"
                  onClick={() => setAccountStatus("continue")}
                  disabled={given === totalAmount}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    accountStatus === "continue"
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  🔄 Continue
                </button>
              </div>

              {accountStatus === "continue" && (
                <div className="mt-3 space-y-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm">
                  <div>
                    <p className="text-amber-800 font-medium">
                      Partial payment recorded
                    </p>
                    <p className="text-amber-700 mt-0.5">
                      ₹{given.toLocaleString("en-IN")} collected now.{" "}
                      <strong>₹{remaining.toLocaleString("en-IN")}</strong>{" "}
                      will remain as new due amount.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-amber-800">
                      New Due Date
                    </label>
                    <input
                      type="date"
                      value={newDueDate}
                      min={todayStr()}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    {!newDueDate && (
                      <p className="mt-1 text-xs text-amber-600">
                        Pick when the remaining amount should be due.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {accountStatus === "closed" && (
                <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                  <p className="font-medium">Account will be closed</p>
                  <p className="mt-0.5 text-emerald-700">
                    {given < totalAmount
                      ? `₹${remaining.toLocaleString("en-IN")} written off.`
                      : "Full amount collected."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}