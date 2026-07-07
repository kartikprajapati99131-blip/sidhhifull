"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AVATAR_COLORS = [
  { bg: "#E6F1FB", text: "#185FA5", border: "#B5D4F4" },
  { bg: "#E1F5EE", text: "#0F6E56", border: "#9FE1CB" },
  { bg: "#FBEAF0", text: "#993556", border: "#F4C0D1" },
  { bg: "#FAEEDA", text: "#854F0B", border: "#FAC775" },
  { bg: "#EEEDFE", text: "#534AB7", border: "#CECBF6" },
  { bg: "#FAECE7", text: "#993C1D", border: "#F5C4B3" },
];

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function toDateStr(raw) {
  if (!raw) return null;
  if (typeof raw === "string" && raw.includes("-")) return raw.split("T")[0];
  const d = new Date(raw);
  if (!isNaN(d)) return d.toISOString().split("T")[0];
  return null;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return null;
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Format a Date for <input type="datetime-local"> in local time
function toDatetimeLocalValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// ── Modal for admin to add a missing exit ────────────────────
function ExitModal({ record, onClose, onSaved }) {
  const [exitTime, setExitTime] = useState(toDatetimeLocalValue(new Date()));
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/attendance/admin-exit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: record._id,
          exitTime: new Date(exitTime).toISOString(),
          remark,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      onSaved(data.record);
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
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Add missing exit
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          {record.userName} · {record.date} · entered{" "}
          {new Date(record.entryTime).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <label className="block text-xs font-medium text-gray-600 mb-1">
          Exit time
        </label>
        <input
          type="datetime-local"
          value={exitTime}
          onChange={(e) => setExitTime(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400"
        />

        <label className="block text-xs font-medium text-gray-600 mb-1">
          Remark
        </label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="e.g. Forgot to clock out, confirmed with employee"
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400 resize-none"
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
            {saving ? "Saving..." : "Save exit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAttendance() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [modalRecord, setModalRecord] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/attendance/get")
      .then((res) => res.json())
      .then(setData);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthKey = todayStr.slice(0, 7); // YYYY-MM

  const grouped = data.reduce((acc, item) => {
    const rawDate =
      item.date ?? item.createdAt ?? item.checkIn ?? item.timestamp ?? item.attendanceDate ?? null;
    const dateStr = toDateStr(rawDate);
    const isToday = dateStr === todayStr;

    if (!acc[item.userId]) {
      acc[item.userId] = {
        userName: item.userName,
        hasRecordToday: isToday,
        todayRecord: isToday ? item : null,
      };
    } else if (isToday) {
      acc[item.userId].hasRecordToday = true;
      acc[item.userId].todayRecord = item;
    }
    return acc;
  }, {});

  const entries = Object.entries(grouped).filter(([, user]) =>
    (user.userName || "").toLowerCase().includes(search.toLowerCase())
  );

  const presentToday = entries.filter(([, user]) => user.hasRecordToday).length;

  const todayLabel = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  // ── Missing exits: this month, excluding today ───────────────
  const missingExits = data
    .filter((item) => {
      if (!item.entryTime || item.exitTime) return false;
      const dateStr = toDateStr(item.date ?? item.entryTime);
      if (!dateStr) return false;
      if (dateStr === todayStr) return false; // skip today — handled inline on the employee card
      return dateStr.slice(0, 7) === currentMonthKey;
    })
    .sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));

  // Patch a record in local state after admin saves an exit,
  // so the UI updates without a full refetch.
  const patchRecord = (updated) => {
    setData((prev) =>
      prev.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Attendance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage employee attendance</p>
        </div>
       <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/salary")}
            className="text-xs font-medium bg-gray-900 text-white px-3 py-1.5 rounded-full hover:bg-gray-800"
          >
            💰 Salary Details
          </button>
          <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-3 py-1.5 rounded-full">
            ✓ Live
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total employees", value: entries.length },
          { label: "Present today", value: presentToday },
          { label: "Today", value: todayLabel },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-xl font-semibold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Missing exits — this month, excluding today */}
      {missingExits.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-3">
            ⚠ {missingExits.length} record{missingExits.length !== 1 ? "s" : ""} missing an exit this month
          </p>
          <div className="flex flex-col gap-2">
            {missingExits.map((rec) => (
              <div
                key={rec._id}
                className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{rec.userName}</span>
                  <span className="text-gray-400 ml-2">{rec.date}</span>
                  <span className="text-gray-400 ml-2">
                    entered{" "}
                    {new Date(rec.entryTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <button
                  onClick={() => setModalRecord(rec)}
                  className="text-xs font-medium bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700"
                >
                  Add exit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-5 shadow-sm">
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
            ×
          </button>
        )}
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400 text-sm">No employees found.</div>
        ) : (
          entries.map(([userId, user], i) => {
            const name = user.userName || "User";
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const rec = user.todayRecord;

            const exitRaw = rec?.exitTime ?? null;
            const hasExited = !!exitRaw;
            const isPresent = user.hasRecordToday;

            const checkInRaw = rec?.entryTime ?? null;
            let totalHoursLabel = "—";
            if (checkInRaw && exitRaw) {
              const ms = new Date(exitRaw) - new Date(checkInRaw);
              totalHoursLabel = formatDuration(ms) ?? "—";
            } else if (checkInRaw && isPresent) {
              const ms = Date.now() - new Date(checkInRaw);
              const live = formatDuration(ms);
              totalHoursLabel = live ? `${live} (live)` : "—";
            }

            let badge;
            if (!isPresent) {
              badge = (
                <span className="text-xs font-medium bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  Absent
                </span>
              );
            } else if (hasExited) {
              badge = (
                <span className="text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full flex-shrink-0">
                  Leave{rec?.exitAddedByAdmin ? " ·  admin" : ""}
                </span>
              );
            } else {
              badge = (
                <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
                  Present
                </span>
              );
            }

            return (
              <div
                key={userId}
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-gray-300 transition-all shadow-sm"
              >
                <div
                  onClick={() => router.push(`/allattendance/${userId}`)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 border cursor-pointer"
                  style={{ background: color.bg, color: color.text, borderColor: color.border }}
                >
                  {getInitials(name)}
                </div>

                <div
                  onClick={() => router.push(`/allattendance/${userId}`)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400">
                    {isPresent ? `⏱ ${totalHoursLabel}` : "No record today"}
                  </p>
                </div>

                {badge}

                {/* Fix missing exit right from the card */}
                {isPresent && !hasExited && (
                  <button
                    onClick={() => setModalRecord(rec)}
                    className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-100 flex-shrink-0"
                  >
                    Add exit
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {modalRecord && (
        <ExitModal
          record={modalRecord}
          onClose={() => setModalRecord(null)}
          onSaved={patchRecord}
        />
      )}
    </div>
  );
}