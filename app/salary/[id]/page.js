"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function EditEmployeeModal({ employee, onClose, onSaved }) {
  const [form, setForm] = useState({
    bankName: employee.bankName || "",
    accountNumber: employee.accountNumber || "",
    ifscCode: employee.ifscCode || "",
    workingHours: employee.workingHours || 8,
    salaryAmount: employee.salaryAmount || 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/employee/${employee.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          workingHours: Number(form.workingHours),
          salaryAmount: Number(form.salaryAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      onSaved(data.employee);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Edit employee details</h3>

        <label className="block text-xs font-medium text-gray-600 mb-1">Bank name</label>
        <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400" />

        <label className="block text-xs font-medium text-gray-600 mb-1">Account number</label>
        <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400" />

        <label className="block text-xs font-medium text-gray-600 mb-1">IFSC code</label>
        <input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400" />

        <label className="block text-xs font-medium text-gray-600 mb-1">Working hours / day</label>
        <input type="number" value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400" />

        <label className="block text-xs font-medium text-gray-600 mb-1">Monthly salary (Rs.)</label>
        <input type="number" value={form.salaryAmount} onChange={(e) => setForm({ ...form, salaryAmount: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400" />

        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-3">{error}</p>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={saving}
            className="flex-1 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 text-sm font-medium text-white bg-gray-900 rounded-lg py-2 hover:bg-gray-800 disabled:opacity-60">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTransactionModal({ userId, onClose, onSaved }) {
  const [type, setType] = useState("debit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date, type, amount: Number(amount), remark }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      onSaved(data.transaction);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Add expense / debit</h3>

        <div className="flex gap-2 mb-3">
          <button onClick={() => setType("debit")}
            className={`flex-1 text-sm font-medium rounded-lg py-2 border ${type === "debit" ? "bg-rose-600 text-white border-rose-600" : "border-gray-200 text-gray-600"}`}>
            Deduct
          </button>
          <button onClick={() => setType("credit")}
            className={`flex-1 text-sm font-medium rounded-lg py-2 border ${type === "credit" ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-200 text-gray-600"}`}>
            Add
          </button>
        </div>

        <label className="block text-xs font-medium text-gray-600 mb-1">Amount (Rs.)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400" />

        <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400" />

        <label className="block text-xs font-medium text-gray-600 mb-1">Remark</label>
        <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3}
          placeholder="e.g. Advance given, uniform cost"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400 resize-none" />

        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-3">{error}</p>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={saving}
            className="flex-1 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 text-sm font-medium text-white bg-gray-900 rounded-lg py-2 hover:bg-gray-800 disabled:opacity-60">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeSalaryPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(
    searchParams.get("from") ||
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`
  );
  const [to, setTo] = useState(searchParams.get("to") || todayStr());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [openMonths, setOpenMonths] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/salary/summary?userId=${id}&from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((res) => {
        const emp = (res.data || [])[0] || null;
        setSummary(emp);
        if (emp) {
          const months = {};
          emp.transactions.forEach((t) => {
            months[t.date.slice(0, 7)] = true;
          });
          const latest = Object.keys(months).sort().reverse()[0];
          if (latest) setOpenMonths({ [latest]: true });
        }
      })
      .finally(() => setLoading(false));
  }, [id, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleMonth = (key) => setOpenMonths((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading && !summary) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Loading...</div>;
  }
  if (!summary) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Employee not found.</div>;
  }

  const txByMonth = {};
  summary.transactions.forEach((t) => {
    const key = t.date.slice(0, 7);
    if (!txByMonth[key]) txByMonth[key] = [];
    txByMonth[key].push(t);
  });
  const monthKeys = Object.keys(txByMonth).sort().reverse();

  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split("-");
    return new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{summary.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{summary.role} · {from} to {to}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
          </div>
          <button onClick={load} className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
            Apply
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Bank & salary details</p>
            <button onClick={() => setShowEdit(true)}
              className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100">
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-gray-400">Bank name</p><p className="text-gray-800">{summary.bankName || "—"}</p></div>
            <div><p className="text-xs text-gray-400">Account no.</p><p className="text-gray-800">{summary.accountNumber || "—"}</p></div>
            <div><p className="text-xs text-gray-400">IFSC code</p><p className="text-gray-800">{summary.ifscCode || "—"}</p></div>
            <div><p className="text-xs text-gray-400">Working hours/day</p><p className="text-gray-800">{summary.workingHours}</p></div>
            <div><p className="text-xs text-gray-400">Monthly salary</p><p className="text-gray-800">Rs. {summary.salaryAmount.toFixed(2)}</p></div>
            <div><p className="text-xs text-gray-400">Hourly rate</p><p className="text-gray-800">Rs. {summary.hourlyRate.toFixed(2)}</p></div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">Income summary</p>
          <div className="grid grid-cols-2 gap-3 text-sm mb-2">
            <div><p className="text-xs text-gray-400">Worked hours</p><p className="text-gray-800">{summary.totalHours.toFixed(1)} hrs</p></div>
            <div><p className="text-xs text-gray-400">Base income</p><p className="text-gray-800">Rs. {summary.baseIncome.toFixed(2)}</p></div>
            <div><p className="text-xs text-gray-400">Added</p><p className="text-emerald-600">+Rs. {summary.credit.toFixed(2)}</p></div>
            <div><p className="text-xs text-gray-400">Deducted</p><p className="text-rose-500">-Rs. {summary.debit.toFixed(2)}</p></div>
          </div>

          {summary.compensationHours > 0 && (
            <div className="grid grid-cols-2 gap-3 text-sm mb-2 pt-2 border-t border-gray-50">
              <div><p className="text-xs text-gray-400">Compensation hours</p><p className="text-emerald-700 font-medium">{summary.compensationHours.toFixed(1)} hrs</p></div>
              <div><p className="text-xs text-gray-400">Total effective hours</p><p className="text-gray-800 font-medium">{summary.totalEffectiveHours.toFixed(1)} hrs</p></div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total income</span>
            <span className="text-xl font-black text-gray-900">Rs. {summary.totalIncome.toFixed(2)}</span>
          </div>
        </div>

        <button onClick={() => setShowAddTx(true)}
          className="w-full mb-4 text-sm font-medium text-white bg-gray-900 rounded-xl py-3 hover:bg-gray-800">
          + Add expense / debit
        </button>

        <div className="flex flex-col gap-3">
          {monthKeys.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm bg-white border border-gray-100 rounded-2xl">
              No expenses or debits recorded.
            </div>
          )}
          {monthKeys.map((monthKey) => {
            const isOpen = !!openMonths[monthKey];
            const txs = txByMonth[monthKey];
            const monthTotal = txs.reduce((s, t) => s + (t.type === "credit" ? t.amount : -t.amount), 0);

            return (
              <div key={monthKey} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => toggleMonth(monthKey)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{formatMonthLabel(monthKey)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{txs.length} entr{txs.length !== 1 ? "ies" : "y"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${monthTotal >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                      {monthTotal >= 0 ? "+" : ""}Rs. {monthTotal.toFixed(2)}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                 <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {txs.map((t) => (
                      <div key={t._id} className="px-5 py-3 flex items-center justify-between group">
                        <div>
                          <p className="text-sm text-gray-800">{t.date}</p>
                          {t.remark && <p className="text-xs text-gray-400 mt-0.5">{t.remark}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${t.type === "credit" ? "text-emerald-600" : "text-rose-500"}`}>
                            {t.type === "credit" ? "+" : "-"}Rs. {t.amount.toFixed(2)}
                          </span>
                          <button
                            onClick={async () => {
                              if (!confirm("Delete this entry?")) return;
                              await fetch(`/api/transactions/${t._id}`, { method: "DELETE" });
                              load();
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 text-sm px-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showEdit && (
        <EditEmployeeModal employee={summary} onClose={() => setShowEdit(false)} onSaved={() => load()} />
      )}
      {showAddTx && (
        <AddTransactionModal userId={id} onClose={() => setShowAddTx(false)} onSaved={() => load()} />
      )}
    </div>
  );
}