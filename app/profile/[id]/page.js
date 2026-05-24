"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const ROLE_STYLES = {
    admin: "bg-violet-100 text-violet-700",
    user: "bg-sky-100 text-sky-700",
    staff: "bg-emerald-100 text-emerald-700",
    mistry: "bg-amber-100 text-amber-700",
    architect: "bg-rose-100 text-rose-700",
};

function StatCard({ label, value, sub }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    );
}

function StarDisplay({ rating }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ))}
        </div>
    );
}

export default function ProfilePage() {
    const { id } = useParams(); // ✅ Next.js guarantees this is available in app router

    const [user, setUser] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true); // ✅ start true, always resolves
    const [error, setError] = useState("");

    useEffect(() => {
        // ✅ no early return — always call setLoading(false) no matter what
        const fetchAll = async () => {
            try {
                if (!id) return; // 🔥 use params id instead

                const res = await fetch(`/api/user/${id}`);

                const data = await res.json();

                if (!res.ok) {
                    setError(`Failed to load user (${res.status})`);
                    return;
                }

                setUser(data?.user || data);

                // ✅ attendance — silent fail
                try {
                    const attRes = await fetch(`/api/attendance/get?userId=${id}`);
                    if (attRes.ok) {
                        const attData = await attRes.json();
                        setAttendance(Array.isArray(attData) ? attData : []);
                    }
                } catch { }

                // ✅ reviews — silent fail
                try {
                    const revRes = await fetch(`/api/review/get?staffId=${id}`);
                    if (revRes.ok) {
                        const revData = await revRes.json();
                        setReviews(Array.isArray(revData) ? revData : []);
                    }
                } catch { }

            } catch (err) {
                console.error("Profile fetch error:", err);
                setError("Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [id]); // ✅ id from app router is always a string, never undefined

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-7 h-7 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !user || user.role === "admin") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-400">
                <p className="text-4xl">😕</p>
                <p className="text-sm">{error || "User not found."}</p>
                <Link href="/users" className="text-sm text-gray-900 underline">
                    ← Back to Users
                </Link>
            </div>
        );
    }

    const isWorker = ["staff","admin"].includes(user.role);
    const isAdmin = ["admin"].includes(user.role);
    const totalHours = attendance.reduce((acc, r) => acc + (r.totalHours || 0), 0);
    const totalDays = new Set(attendance.map((r) => r.date)).size;
    const avgRating = reviews.length
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;
    const pointsLog = user.pointsLog || [];

    const formatDate = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

                {/* BACK */}
                {isAdmin && (
                    <Link href="/users" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition mb-6">
                        ← Back to Users
                    </Link>
                )}
                {!isAdmin && (
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition mb-6">
                        ← Back
                    </Link>
                )}
                

                {/* PROFILE HEADER */}
                <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center text-white text-3xl font-black flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
                        <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
                        {user.phone && (
                            <p className="text-gray-400 text-sm mt-0.5">📞 {user.phone}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start flex-wrap">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${ROLE_STYLES[user.role] || "bg-gray-100 text-gray-600"}`}>
                                {user.role}
                            </span>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                                ⭐ {user.points || 0} points
                            </span>
                            <span className="text-xs text-gray-400">
                                Joined {formatDate(user.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* WORKER STATS */}
                {isWorker && (
                    <>
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Overview</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            <StatCard label="Total Days" value={totalDays} sub="days present" />
                            <StatCard label="Total Hours" value={`${totalHours.toFixed(1)}h`} sub="worked" />
                            <StatCard label="Avg Rating" value={avgRating ? avgRating.toFixed(1) : "—"} sub={`${reviews.length} reviews`} />
                            <StatCard label="Points" value={user.points || 0} sub="earned" />
                        </div>

                        {/* REVIEWS */}
                        {reviews.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
                                    Customer Reviews
                                </h2>
                                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-4">
                                        <span className="text-4xl font-black text-gray-900">{avgRating.toFixed(1)}</span>
                                        <div>
                                            <StarDisplay rating={avgRating} />
                                            <p className="text-xs text-gray-400 mt-1">{reviews.length} reviews</p>
                                        </div>
                                        <div className="flex-1 ml-4 hidden sm:block">
                                            {[5, 4, 3, 2, 1].map((star) => {
                                                const count = reviews.filter((r) => r.rating === star).length;
                                                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-gray-400 w-2">{star}</span>
                                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-xs text-gray-400 w-4">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                                        {reviews.map((r) => (
                                            <div key={r._id} className="px-5 py-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <StarDisplay rating={r.rating} />
                                                        <span className="text-xs font-semibold text-gray-700">{r.reviewerName}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                                                </div>
                                                {r.comment && <p className="text-sm text-gray-500">"{r.comment}"</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ATTENDANCE LINK */}
                        <div className="mb-6">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
                                Attendance
                            </h2>
                            <Link
                                href={`/allattendance/${id}`}
                                className="block bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-4 hover:shadow-md transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">View Full Attendance</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{totalDays} days · {totalHours.toFixed(1)} hrs total</p>
                                    </div>
                                    <span className="text-gray-400">→</span>
                                </div>
                            </Link>
                        </div>
                    </>
                )}

                {/* POINTS LOG */}
                <div>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
                        Points History
                    </h2>
                    {pointsLog.length > 0 ? (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                            {pointsLog.slice().reverse().map((log, i) => (
                                <div key={i} className="px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700 font-medium">
                                            {log.reason || "Points adjustment"}
                                        </p>
                                        <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                                    </div>
                                    <span className={`text-sm font-black ${log.amount > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                        {log.amount > 0 ? "+" : ""}{log.amount} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-8 text-center text-gray-400">
                            <p className="text-2xl mb-2">⭐</p>
                            <p className="text-sm">No points history yet.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}