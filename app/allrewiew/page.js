// app/admin/reviews/page.jsx  — ADMIN DASHBOARD showing all staff + averages
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function StarDisplay({ rating, size = "sm" }) {
    const filled = Math.round(rating);
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg
                    key={s}
                    className={`${size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5"} ${s <= filled ? "text-amber-400" : "text-gray-200"
                        }`}
                    fill="currentColor" viewBox="0 0 24 24"
                >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ))}
        </div>
    );
}

function RatingBadge({ rating }) {
    const color =
        rating >= 4.5 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            rating >= 3.5 ? "bg-amber-50 text-amber-700 border-amber-200" :
                "bg-rose-50 text-rose-700 border-rose-200";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${color}`}>
            {rating?.toFixed(1) || "—"}
        </span>
    );
}

function ConfirmDialog({ name, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-xs w-full">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-center font-black text-gray-900 mb-1">Delete Review?</h3>
                <p className="text-center text-sm text-gray-400 mb-5">
                    This will permanently remove the review{name ? ` from <strong>${name}</strong>` : ""}. This action cannot be undone.
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-rose-500 text-sm font-bold text-white hover:bg-rose-600 active:scale-[0.98] transition-all"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ReviewsDashboard() {
    const [staffList, setStaffList] = useState([]);
    const [selected, setSelected] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { reviewId, reviewerName }
    const [deletingId, setDeletingId] = useState(null);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        fetch("/api/review/summary")
            .then((r) => r.json())
            .then((d) => setStaffList(Array.isArray(d) ? d : []))
            .finally(() => setLoading(false));
    }, []);

    const loadReviews = async (staffId) => {
        setSelected(staffId);
        setLoadingReviews(true);
        setDeleteError("");
        try {
            const res = await fetch(`/api/review/get?staffId=${staffId}`);
            const d = await res.json();
            setReviews(Array.isArray(d) ? d : []);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeletingId(deleteTarget.reviewId);
        setDeleteTarget(null);
        setDeleteError("");
        try {
            const res = await fetch(`/api/review/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewId: deleteTarget.reviewId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete");

            // Remove from local state
            setReviews((prev) => prev.filter((r) => r._id !== deleteTarget.reviewId));

            // Update staff list avg/count locally (optional optimistic update)
            setStaffList((prev) =>
                prev.map((s) => {
                    if (s._id !== selected) return s;
                    const remaining = reviews.filter((r) => r._id !== deleteTarget.reviewId);
                    const avg = remaining.length
                        ? remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length
                        : 0;
                    return { ...s, totalReviews: remaining.length, avgRating: avg };
                })
            );
        } catch (err) {
            setDeleteError(err.message || "Failed to delete review.");
        } finally {
            setDeletingId(null);
        }
    };

    const selectedStaff = staffList.find((s) => s._id === selected);

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
        });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            {/* Confirm Delete Dialog */}
            {deleteTarget && (
                <ConfirmDialog
                    name={deleteTarget.reviewerName}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

                    {/* HEADER */}
                    <div className="mb-8 flex items-end justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reviews</h1>
                            <p className="text-sm text-gray-400 mt-1">Customer feedback for your team</p>
                        </div>
                        <div className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-sm font-medium">
                            {staffList.length} staff · {staffList.reduce((a, s) => a + (s.totalReviews || 0), 0)} reviews
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* LEFT — STAFF CARDS */}
                        <div className="flex flex-col gap-3">
                            {staffList.length === 0 && (
                                <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                                    No reviews yet.
                                </div>
                            )}

                            {staffList.map((staff) => (
                                <button
                                    key={staff._id}
                                    onClick={() => loadReviews(staff._id)}
                                    className={`w-full text-left bg-white border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${selected === staff._id
                                            ? "border-gray-900 ring-1 ring-gray-900"
                                            : "border-gray-100 hover:border-gray-300"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                                            {staff.name?.[0]?.toUpperCase() || "?"}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 text-sm truncate">{staff.name}</p>
                                            <p className="text-xs text-gray-400 capitalize">{staff.role}</p>

                                            <div className="flex items-center gap-2 mt-1.5">
                                                <StarDisplay rating={staff.avgRating} />
                                                <RatingBadge rating={staff.avgRating} />
                                                <span className="text-xs text-gray-400">
                                                    ({staff.totalReviews} review{staff.totalReviews !== 1 ? "s" : ""})
                                                </span>
                                            </div>
                                        </div>

                                        {/* Share link */}
                                        <Link
                                            href={`/review/${staff._id}`}
                                            target="_blank"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-shrink-0 text-[10px] text-gray-400 border border-gray-200 rounded-lg px-2 py-1 hover:border-gray-400 hover:text-gray-700 transition-colors"
                                        >
                                            Share ↗
                                        </Link>
                                    </div>

                                    {/* Rating bar */}
                                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                            style={{ width: `${((staff.avgRating || 0) / 5) * 100}%` }}
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* RIGHT — REVIEWS PANEL */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            {!selected ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 text-gray-300">
                                    <p className="text-4xl mb-3">👈</p>
                                    <p className="text-sm">Select a staff member to see their reviews</p>
                                </div>
                            ) : (
                                <>
                                    {/* Panel Header */}
                                    <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/60">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-black text-gray-900">{selectedStaff?.name}</p>
                                                <p className="text-xs text-gray-400 capitalize mt-0.5">{selectedStaff?.role}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <StarDisplay rating={selectedStaff?.avgRating} size="md" />
                                                    <span className="text-lg font-black text-gray-900">
                                                        {selectedStaff?.avgRating?.toFixed(1)}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {selectedStaff?.totalReviews} review{selectedStaff?.totalReviews !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete error */}
                                    {deleteError && (
                                        <div className="mx-5 mt-3 text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-center">
                                            ⚠ {deleteError}
                                        </div>
                                    )}

                                    {/* Reviews List */}
                                    <div className="divide-y divide-gray-50 max-h-[540px] overflow-y-auto">
                                        {loadingReviews ? (
                                            <div className="flex justify-center py-10">
                                                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : reviews.length === 0 ? (
                                            <p className="text-center text-sm text-gray-400 py-10">
                                                No reviews yet.
                                            </p>
                                        ) : (
                                            reviews.map((r) => (
                                                <div
                                                    key={r._id}
                                                    className={`px-5 py-4 transition-opacity ${deletingId === r._id ? "opacity-30 pointer-events-none" : ""}`}
                                                >
                                                    {/* Top row: stars + date + delete */}
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <StarDisplay rating={r.rating} />
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className="text-[11px] text-gray-400">
                                                                {formatDate(r.createdAt)}
                                                            </span>
                                                            <button
                                                                onClick={() => setDeleteTarget({ reviewId: r._id, reviewerName: r.reviewerName })}
                                                                className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                                                title="Delete review"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Reviewer name + phone */}
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0">
                                                            {r.reviewerName?.[0]?.toUpperCase() || "?"}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-700 leading-none">
                                                                {r.reviewerName || "Anonymous"}
                                                            </p>
                                                            {r.reviewerPhone && (
                                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                                    📞 {r.reviewerPhone}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Comment */}
                                                    {r.comment ? (
                                                        <p className="text-sm text-gray-600 leading-relaxed pl-10">
                                                            "{r.comment}"
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-gray-300 italic pl-10">No comment</p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
