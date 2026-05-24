"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ReviewPage() {
    const { id } = useParams();

    const [staff, setStaff] = useState(null);
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState("");
    const [reviewerName, setReviewerName] = useState("");
    const [reviewerPhone, setReviewerPhone] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        // ✅ use your existing user API instead of /api/staff
        fetch(`/api/user/${id}`)
            .then((r) => r.json())
            .then((d) => {
                setStaff(d?.user || d); // handle both { user: {...} } or direct object
            })
            .catch(() => setError("Could not load staff info."));
    }, [id]);

    const handleSubmit = async () => {
        // Validate all required fields
        if (!reviewerName.trim()) { setError("Please enter your name."); return; }
        if (!reviewerPhone.trim()) { setError("Please enter your phone number."); return; }
        if (reviewerPhone.length < 10) { setError("Please enter a valid 10-digit phone number."); return; }
        if (rating === 0) { setError("Please select a star rating."); return; }

        setError("");
        setSubmitting(true);
        try {
            const res = await fetch("/api/review/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    staffId: id,
                    rating,
                    comment,
                    reviewerName: reviewerName.trim(),
                    reviewerPhone: reviewerPhone.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");
            setSubmitted(true);
        } catch (err) {
            setError(err.message || "Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-6">
                <div className="text-center max-w-xs">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 text-5xl">
                        ✓
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Thank you, {reviewerName}!</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Your review has been submitted. We really appreciate your feedback.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm">

                {/* STAFF INFO */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-lg">
                        {staff?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <h1 className="text-xl font-black text-gray-900">
                        {staff?.name || "Staff Member"}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1 capitalize">
                        {staff?.role || "Team Member"}
                    </p>
                </div>

                {/* CARD */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">

                    <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest">
                        Rate your experience
                    </p>

                    {/* STARS */}
                    <div className="flex justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHovered(star)}
                                onMouseLeave={() => setHovered(0)}
                                className="transition-transform duration-100 hover:scale-110 active:scale-95"
                            >
                                <svg
                                    className={`w-10 h-10 transition-colors duration-150 ${
                                        star <= (hovered || rating)
                                            ? "text-amber-400"
                                            : "text-gray-200"
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </button>
                        ))}
                    </div>

                    {/* RATING LABEL */}
                    {(hovered || rating) > 0 && (
                        <p className="text-center text-sm font-semibold text-amber-500 -mt-2">
                            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][hovered || rating]}
                        </p>
                    )}

                    {/* REVIEWER NAME — required */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Your Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full text-sm bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 transition placeholder:text-gray-300 text-gray-800"
                        />
                    </div>

                    {/* REVIEWER PHONE — required */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={reviewerPhone}
                            onChange={(e) => {
                                // only allow digits, max 10
                                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setReviewerPhone(val);
                            }}
                            placeholder="10-digit mobile number"
                            className="w-full text-sm bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 transition placeholder:text-gray-300 text-gray-800"
                        />
                    </div>

                    {/* COMMENT — optional */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Comment <span className="text-gray-300">(optional)</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            rows={3}
                            className="w-full text-sm bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 transition placeholder:text-gray-300 text-gray-800"
                        />
                    </div>

                    {/* ERROR */}
                    {error && (
                        <p className="text-xs text-rose-500 text-center bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                            ⚠ {error}
                        </p>
                    )}

                    {/* SUBMIT */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-gray-900 text-white py-3.5 rounded-2xl text-sm font-bold tracking-wide hover:bg-gray-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Submitting...
                            </span>
                        ) : "Submit Review"}
                    </button>
                </div>

                <p className="text-center text-xs text-gray-300 mt-5">
                    Powered by your team's feedback system
                </p>
            </div>
        </div>
    );
}