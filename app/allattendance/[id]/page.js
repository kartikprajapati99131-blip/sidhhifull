"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

function formatHM(hours = 0, minutes = 0) {
    return `+${hours}h ${minutes}m`;
}

export default function UserAttendancePage() {
    const { data: session } = useSession();
    const canViewSalary = ["admin", "subadmin"].includes(session?.user?.role);

    const formatHours = (hours) => {
        if (!hours) return "0 hr";
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h} hr ${m} min`;
    };

    const { id } = useParams();

    // ── Raw data from the two APIs ────────────────────────────
    const [rawAttendance, setRawAttendance] = useState([]);
    const [compensation, setCompensation] = useState([]);
    const [attLoaded, setAttLoaded] = useState(false);
    const [compLoaded, setCompLoaded] = useState(false);

    // ── Merged, month-grouped data (attendance + compensation, one place) ──
    const [data, setData] = useState([]);
    const [openMonths, setOpenMonths] = useState({});

    useEffect(() => {
        if (!id) return;

        fetch(`/api/attendance/get?userId=${id}`)
            .then((res) => res.json())
            .then((res) => {
                const records = Array.isArray(res) ? res : res.data || res.attendance || [];
                setRawAttendance(records);
                setAttLoaded(true);
            });
    }, [id]);

    useEffect(() => {
        if (!id) return;

        // Server automatically scopes non-managers to their own id, and
        // managers can look up any employeeId — same rule as attendance.
        fetch(`/api/compensation?employeeId=${id}`)
            .then((res) => res.json())
            .then((res) => {
                setCompensation(res.records || []);
                setCompLoaded(true);
            });
    }, [id]);

    // ── Merge attendance + compensation into one set of day cards, ──
    // grouped by month, so everything for a date shows in one place. ──
    useEffect(() => {
        if (!attLoaded || !compLoaded) return;

        const grouped = {};

        rawAttendance.forEach((record) => {
            const date = record.date;
            if (!grouped[date]) grouped[date] = { date, sessions: [], compensations: [] };
            grouped[date].sessions.push({
                entryTime: record.entryTime?.$date || record.entryTime,
                exitTime: record.exitTime?.$date || record.exitTime,
                totalHours: record.totalHours,
                remark: record.remark || "",
                exitAddedByAdmin: !!record.exitAddedByAdmin,
            });
        });

        compensation.forEach((rec) => {
            const date = rec.date;
            if (!grouped[date]) grouped[date] = { date, sessions: [], compensations: [] };
            grouped[date].compensations.push(rec);
        });

        const byMonth = {};
        Object.values(grouped).forEach((day) => {
            const monthKey = day.date.slice(0, 7);
            if (!byMonth[monthKey]) byMonth[monthKey] = { monthKey, days: [] };
            byMonth[monthKey].days.push(day);
        });

        const sortedMonths = Object.values(byMonth)
            .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
            .slice(0, 2);

        sortedMonths.forEach((m) => {
            m.days.sort((a, b) => new Date(b.date) - new Date(a.date));
        });

        setData(sortedMonths);

        if (sortedMonths.length > 0) {
            setOpenMonths({ [sortedMonths[0].monthKey]: true });
        }
    }, [rawAttendance, compensation, attLoaded, compLoaded]);

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

    // ── Hour helpers — worked hours and compensation hours are kept ──
    // separately so summaries can show a breakdown, but every date's ──
    // card renders both together in one place. ──
    const getDailyWorkedHours = (sessions = []) =>
        sessions.reduce((acc, s) => acc + (s.totalHours || 0), 0);

    const getDailyCompHours = (comps = []) =>
        comps.reduce((acc, c) => acc + (c.hours || 0) + (c.minutes || 0) / 60, 0);

    const getDailyTotal = (day) =>
        getDailyWorkedHours(day.sessions) + getDailyCompHours(day.compensations);

    const getMonthWorkedHours = (days = []) =>
        days.reduce((acc, d) => acc + getDailyWorkedHours(d.sessions), 0);

    const getMonthCompHours = (days = []) =>
        days.reduce((acc, d) => acc + getDailyCompHours(d.compensations), 0);

    // ── Current month hours only ──────────────────────────────
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const currentMonthData = data.find((m) => m.monthKey === currentMonthKey);
    const currentMonthHours = currentMonthData ? getMonthWorkedHours(currentMonthData.days) : 0;
    const currentMonthCompensationHours = currentMonthData ? getMonthCompHours(currentMonthData.days) : 0;
    const totalEffectiveHours = currentMonthHours + currentMonthCompensationHours;
    const currentMonthLabel = new Date().toLocaleString("en-IN", { month: "long" });

    const toggleMonth = (key) =>
        setOpenMonths((prev) => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Attendance
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">Last 2 months</p>
                    </div>
                    {canViewSalary && (
                        <div className="flex items-center gap-2">
                            <a
                                href={`/compensation/${id}`}
                                className="text-xs font-medium bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-800"
                            >
                                🧾 Compensation
                            </a>
                            <a
                                href={`/salary/${id}`}
                                className="text-xs font-medium bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-800"
                            >
                                💰 Salary
                            </a>
                        </div>
                    )}
                </div>

                {/* CURRENT MONTH HOURS CARD */}
                <div className="mb-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                            {currentMonthLabel} Hours
                        </p>
                        <p className="text-3xl font-black text-gray-900 mt-0.5">
                            {formatHours(totalEffectiveHours)}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl">
                        ⏱
                    </div>
                </div>

                {/* COMPENSATION + TOTAL EFFECTIVE HOURS — additive, does not change attendance calc above */}
                {currentMonthCompensationHours > 0 && (
                    <div className="mb-6 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Worked Hours</span>
                            <span className="font-semibold text-gray-900">{formatHours(currentMonthHours)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1.5">
                            <span className="text-gray-500">Compensation</span>
                            <span className="font-semibold text-emerald-700">
                                {formatHours(currentMonthCompensationHours)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-50">
                            <span className="text-gray-700 font-medium">Total Effective Hours</span>
                            <span className="font-bold text-gray-900">{formatHours(totalEffectiveHours)}</span>
                        </div>
                    </div>
                )}
                {currentMonthCompensationHours === 0 && <div className="mb-6" />}

                {/* EMPTY */}
                {data.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-sm">No attendance records found.</p>
                    </div>
                )}

                {/* MONTH ACCORDION — attendance sessions AND compensation entries ──
                    for a date live inside that date's card, all in one place. ── */}
                <div className="flex flex-col gap-3">
                    {data.map((month) => {
                        const isMonthOpen = !!openMonths[month.monthKey];
                        const monthWorked = getMonthWorkedHours(month.days);
                        const monthComp = getMonthCompHours(month.days);
                        const monthTotal = monthWorked + monthComp;
                        const totalDays = month.days.length;

                        return (
                            <div
                                key={month.monthKey}
                                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
                            >
                                {/* MONTH HEADER */}
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
                                                {monthComp > 0 && (
                                                    <span className="text-emerald-600">
                                                        {" "}(incl. {formatHours(monthComp)} comp)
                                                    </span>
                                                )}
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
                                            const dailyTotal = getDailyTotal(day);
                                            const hasSessions = day.sessions.length > 0;
                                            const hasComp = day.compensations.length > 0;

                                            return (
                                                <div key={dayKey}>
                                                    {/* DAY ROW */}
                                                    <div className="px-5 py-3">
                                                        {/* Day label + daily total (worked + compensation combined) */}
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-semibold text-gray-500">
                                                                {formatDayLabel(day.date)}
                                                            </span>
                                                            <span className="text-xs font-semibold text-gray-400">
                                                                {formatHours(dailyTotal)}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            {/* SESSIONS */}
                                                            {day.sessions.map((s, i) => (
                                                                <div
                                                                    key={`s-${i}`}
                                                                    className="flex flex-col bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5"
                                                                >
                                                                    {/* Time range + hours badge */}
                                                                    <div className="flex items-center justify-between">
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

                                                                        <div className="flex items-center gap-1.5">
                                                                            {/* Admin badge, shown next to the hours pill */}
                                                                            {s.exitAddedByAdmin && (
                                                                                <span className="text-[10px] font-semibold px-2 py-1 rounded-full text-amber-700 bg-amber-50 border border-amber-100">
                                                                                    🛠 Admin
                                                                                </span>
                                                                            )}

                                                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.totalHours
                                                                                    ? "text-emerald-700 bg-emerald-50 border border-emerald-100"
                                                                                    : "text-amber-600 bg-amber-50 border border-amber-100"
                                                                                }`}>
                                                                                {s.totalHours ? formatHours(s.totalHours) : "In progress"}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Remark, only when exit was added by admin */}
                                                                    {s.exitAddedByAdmin && (
                                                                        <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                                                                            <span className="mt-px">📝</span>
                                                                            <span>
                                                                                {s.remark
                                                                                    ? s.remark
                                                                                    : "Exit added by admin (no remark given)"}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}

                                                            {/* COMPENSATION ENTRIES — same date card, same place as ──
                                                                the attendance sessions above, not a separate section ── */}
                                                            {day.compensations.map((rec) => (
                                                                <div
                                                                    key={`c-${rec._id}`}
                                                                    className="flex flex-col bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-1.5 text-sm">
                                                                            <span>💰</span>
                                                                            <span className="font-semibold text-emerald-800">
                                                                                {rec.reason}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-xs font-semibold px-2 py-1 rounded-full text-emerald-700 bg-white border border-emerald-100">
                                                                            {formatHM(rec.hours, rec.minutes)}
                                                                        </span>
                                                                    </div>

                                                                   
                                                                </div>
                                                            ))}

                                                            {!hasSessions && !hasComp && (
                                                                <p className="text-xs text-gray-400 italic">No records</p>
                                                            )}
                                                        </div>
                                                    </div>
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
