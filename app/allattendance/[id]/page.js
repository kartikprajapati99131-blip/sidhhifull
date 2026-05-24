"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function UserAttendancePage() {

    const formatHours = (hours) => {
        if (!hours) return "0 hr";

        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);

        return `${h} hr ${m} min`;
    };

    const { id } = useParams();
    const [data, setData] = useState([]);
    const [openMonths, setOpenMonths] = useState({});
    const [openDays, setOpenDays] = useState({});

    useEffect(() => {
        if (!id) return;

        fetch(`/api/attendance/get?userId=${id}`)
            .then((res) => res.json())
            .then((res) => {
                const records = Array.isArray(res) ? res : res.data || res.attendance || [];

                // Group by date
                const grouped = {};
                records.forEach((record) => {
                    const date = record.date;
                    if (!grouped[date]) grouped[date] = { date, sessions: [] };
                    grouped[date].sessions.push({
                        entryTime: record.entryTime?.$date || record.entryTime,
                        exitTime: record.exitTime?.$date || record.exitTime,
                        totalHours: record.totalHours,
                    });
                });

                // Group by month
                const byMonth = {};
                Object.values(grouped).forEach((day) => {
                    const monthKey = day.date.slice(0, 7); // "2026-04"
                    if (!byMonth[monthKey]) byMonth[monthKey] = { monthKey, days: [] };
                    byMonth[monthKey].days.push(day);
                });

                // Sort months descending, keep only last 2
                const sortedMonths = Object.values(byMonth)
                    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
                    .slice(0, 2);

                // Sort days within each month descending
                sortedMonths.forEach((m) => {
                    m.days.sort((a, b) => new Date(b.date) - new Date(a.date));
                });

                setData(sortedMonths);

                // Auto-open the most recent month
                if (sortedMonths.length > 0) {
                    setOpenMonths({ [sortedMonths[0].monthKey]: true });
                }
            });
    }, [id]);

    const formatTime = (dateInput) => {
        if (!dateInput) return "--";
        const date = new Date(dateInput);
        if (isNaN(date)) return "--";
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12 || 12;
        return `${hours}:${minutes}${ampm}`;
    };

    const formatMonthLabel = (monthKey) => {
        const [year, month] = monthKey.split("-");
        return new Date(year, month - 1).toLocaleString("en-IN", {
            month: "long",
            year: "numeric",
        });
    };

    const formatDayLabel = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
    };

    const getDailyTotal = (sessions = []) =>
        sessions.reduce((acc, s) => acc + (s.totalHours || 0), 0);

    const getMonthTotal = (days = []) =>
        days.reduce((acc, d) => acc + getDailyTotal(d.sessions), 0);

    const totalAllHours = data.reduce((acc, m) => acc + getMonthTotal(m.days), 0);

    const toggleMonth = (key) =>
        setOpenMonths((prev) => ({ ...prev, [key]: !prev[key] }));

    const toggleDay = (key) =>
        setOpenDays((prev) => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Attendance
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Last 2 months</p>
                </div>

                {/* TOTAL HOURS CARD */}
                <div className="mb-6 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                            Total Hours
                        </p>
                        <p className="text-3xl font-black text-gray-900 mt-0.5">
                            {formatHours(totalAllHours)}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl">
                        ⏱
                    </div>
                </div>

                {/* EMPTY */}
                {data.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-sm">No attendance records found.</p>
                    </div>
                )}

                {/* MONTH ACCORDION */}
                <div className="flex flex-col gap-3">
                    {data.map((month) => {
                        const isMonthOpen = !!openMonths[month.monthKey];
                        const monthTotal = getMonthTotal(month.days);
                        const totalDays = month.days.length;

                        return (
                            <div
                                key={month.monthKey}
                                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
                            >
                                {/* MONTH HEADER — clickable */}
                                <button
                                    onClick={() => toggleMonth(month.monthKey)}
                                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                                            {month.monthKey.slice(5)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {formatMonthLabel(month.monthKey)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {totalDays} day{totalDays !== 1 ? "s" : ""} · {formatHours(monthTotal)}
                                            </p>
                                        </div>
                                    </div>

                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isMonthOpen ? "rotate-180" : ""}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* DAYS LIST */}
                                {isMonthOpen && (
                                    <div className="border-t border-gray-50 divide-y divide-gray-50">
                                        {month.days.map((day) => {
                                            const dayKey = day.date;
                                            const isDayOpen = !!openDays[dayKey];
                                            const dailyTotal = getDailyTotal(day.sessions);

                                            return (
                                                <div key={dayKey}>
                                                    {/* DAY ROW — clickable */}
                                                    <button
                                                        onClick={() => toggleDay(dayKey)}
                                                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50/80 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-semibold text-gray-500 w-24 text-left">
                                                                {formatDayLabel(day.date)}
                                                            </span>

                                                        </div>

                                                        <div className="flex items-center gap-2">

                                                            <div className="px-5 pb-3 flex flex-col gap-4">
                                                                {day.sessions.map((s, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="gap-2 flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5"
                                                                    >
                                                                        <div className="flex items-center gap-1.5 text-sm">
                                                                            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                                                            <span className="font-semibold text-gray-800">
                                                                                {formatTime(s.entryTime)}
                                                                            </span>
                                                                            <span className="text-gray-300 mx-1">→</span>
                                                                            <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                                                                            <span className="font-semibold text-gray-800">
                                                                                {formatTime(s.exitTime)}
                                                                            </span>
                                                                        </div>

                                                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.totalHours
                                                                            ? "text-emerald-700 bg-emerald-50 border border-emerald-100"
                                                                            : "text-amber-600 bg-amber-50 border border-amber-100"
                                                                            }`}>
                                                                            {s.totalHours ? formatHours(s.totalHours) : "In progress"}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                        </div>
                                                    </button>

                                                    {/* SESSIONS */}

                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}