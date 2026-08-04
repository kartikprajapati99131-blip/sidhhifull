"use client";

import { useState } from "react";

// initial       -> existing record when editing, null/undefined when adding
// employees     -> list for the dropdown (omit when fixedEmployee is set)
// fixedEmployee -> { userId, userName } — locks the employee, used on the
//                  per-employee [id] page so the field can't be changed
export default function CompensationModal({ initial, employees, fixedEmployee, onClose, onSaved }) {
  const isEdit = !!initial?._id;

  const [employeeId, setEmployeeId] = useState(initial?.employeeId || fixedEmployee?.userId || "");
  const [hours, setHours] = useState(initial?.hours ?? "");
  const [minutes, setMinutes] = useState(initial?.minutes ?? "");
  const [reason, setReason] = useState(initial?.reason || "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");

    const employee = fixedEmployee || employees?.find((e) => e.userId === employeeId);
    if (!employee) {
      setError("Please select an employee.");
      return;
    }
    if (hours === "" || hours === null || Number(hours) < 0) {
      setError("Hours is required and must be 0 or more.");
      return;
    }
    const minutesNum = minutes === "" ? 0 : Number(minutes);
    if (minutesNum < 0 || minutesNum > 59) {
      setError("Minutes must be between 0 and 59.");
      return;
    }
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/compensation/${initial._id}` : "/api/compensation/create";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.userId,
          employeeName: employee.userName,
          hours: Number(hours),
          minutes: minutesNum,
          reason: reason.trim(),
          description: reason.trim(),
          date,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      onSaved(data.record, isEdit);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          {isEdit ? "Edit Compensation" : "Add Compensation"}
        </h3>

        {fixedEmployee ? (
          <>
            <label className="block text-xs font-medium text-gray-600 mb-1">Employee</label>
            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 bg-gray-50 text-gray-700">
              {fixedEmployee.userName}
            </div>
          </>
        ) : (
          <>
            <label className="block text-xs font-medium text-gray-600 mb-1">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400 bg-white"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.userId} value={emp.userId}>
                  {emp.userName}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hours</label>
            <input
              type="number"
              min={0}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Minutes</label>
            <input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>

        <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Factory Visit, Sunday Work, Overtime"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400"
        />

        <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400"
        />

        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 text-sm font-medium text-white bg-gray-900 rounded-lg py-2 hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
