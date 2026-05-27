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
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function toDateStr(raw) {
  if (!raw) return null;
  if (typeof raw === "string" && raw.includes("-")) return raw.split("T")[0];
  const d = new Date(raw);
  if (!isNaN(d)) return d.toISOString().split("T")[0];
  return null;
}

export default function AdminAttendance() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/attendance/get")
      .then((res) => res.json())
      .then(setData);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  // Group by userId
  // hasRecordToday = true if ANY record for this user has today's date
  const grouped = data.reduce((acc, item) => {
    const rawDate =
      item.date ??
      item.createdAt ??
      item.checkIn ??
      item.timestamp ??
      item.attendanceDate ??
      null;

    const dateStr = toDateStr(rawDate);
    const isToday = dateStr === todayStr;

    if (!acc[item.userId]) {
      acc[item.userId] = {
        userName: item.userName,
        hasRecordToday: isToday, // ✅ true only if this record is from today
      };
    } else {
      // If ANY record for this user is from today, mark present
      if (isToday) {
        acc[item.userId].hasRecordToday = true;
      }
    }
    return acc;
  }, {});

  const entries = Object.entries(grouped).filter(([, user]) =>
    (user.userName || "").toLowerCase().includes(search.toLowerCase())
  );

  const presentToday = entries.filter(([, user]) => user.hasRecordToday).length;

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Attendance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage employee attendance</p>
        </div>
        <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-3 py-1.5 rounded-full">
          ✓ Live
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {
            label: "Total employees",
            value: entries.length,
            icon: (
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ),
          },
          {
            label: "Present today",
            value: presentToday,
            icon: (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ),
          },
          {
            label: "Today",
            value: todayLabel,
            icon: (
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ),
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              {s.icon}
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
            <p className="text-xl font-semibold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-5 shadow-sm">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400 text-sm">
            No employees found.
          </div>
        ) : (
          entries.map(([userId, user], i) => {
            const name = user.userName || "User";
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];

            // ✅ Present = has ANY record dated today
            // ❌ Absent = no record today (even if they have old records running)
            const isPresent = user.hasRecordToday;

            return (
              <div
                key={userId}
                onClick={() => router.push(`/allattendance/${userId}`)}
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-gray-300 hover:-translate-y-px transition-all shadow-sm"
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 border"
                  style={{
                    background: color.bg,
                    color: color.text,
                    borderColor: color.border,
                  }}
                >
                  {getInitials(name)}
                </div>

                {/* Name + ID */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400">ID: {userId}</p>
                </div>

                {/* Present / Absent badge */}
                {isPresent ? (
                  <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
                    Present
                  </span>
                ) : (
                  <span className="text-xs font-medium bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    Absent
                  </span>
                )}

                {/* Arrow */}
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}