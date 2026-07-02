"use client";

import { useState, useEffect } from "react";

export default function AttendancePage() {
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // "success" | "error"
  const [loading, setLoading] = useState(null); // "entry" | "exit" | null
  const [time, setTime] = useState(new Date());
  const [lastAction, setLastAction] = useState(null); // { type, time }

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (date) => {
    let h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    const s = date.getSeconds().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return { time: `${h}:${m}:${s}`, ampm };
  };

  const formatDate = (date) =>
    date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const submit = async (type) => {
    setLoading(type);
    setMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/attendance/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              type,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            setMsg(data.error || "Something went wrong.");
            setMsgType("error");
          } else {
            setMsg(
              data.message +
                (data.totalHours ? ` · ${data.totalHours} hrs` : "")
            );
            setMsgType("success");
            setLastAction({ type, time: new Date() });
          }
        } catch {
          setMsg("Network error. Please try again.");
          setMsgType("error");
        } finally {
          setLoading(null);
        }
      },
      () => {
        setMsg("Location access denied. Please enable GPS.");
        setMsgType("error");
        setLoading(null);
      }
    );
  };

  const { time: clockTime, ampm } = formatClock(time);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center  relative overflow-hidden">

      {/* Background grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white opacity-[0.02] blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 mb-1">
            {formatDate(time)}
          </p>

          {/* Big Clock */}
          <div className="flex items-end justify-center gap-2 mt-4">
            <span className="text-6xl sm:text-7xl font-black text-white tabular-nums leading-none tracking-tight">
              {clockTime}
            </span>
            <span className="text-lg font-bold text-gray-500 mb-2">{ampm}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">

          {/* ENTRY */}
          <button
            onClick={() => submit("entry")}
            disabled={!!loading}
            className={`relative group flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border transition-all duration-300 overflow-hidden
              ${loading === "entry"
                ? "bg-emerald-950 border-emerald-700"
                : "bg-[#111] border-[#222] hover:border-emerald-600 hover:bg-emerald-950/40"
              }`}
          >
            {/* Glow on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-emerald-900/20 to-transparent pointer-events-none rounded-2xl" />

            {loading === "entry" ? (
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-emerald-400 tracking-widest uppercase">
                  Entry
                </span>
                <span className="text-[10px] text-emerald-700">Clock In</span>
              </>
            )}
          </button>

          {/* EXIT */}
          <button
            onClick={() => submit("exit")}
            disabled={!!loading}
            className={`relative group flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border transition-all duration-300 overflow-hidden
              ${loading === "exit"
                ? "bg-rose-950 border-rose-700"
                : "bg-[#111] border-[#222] hover:border-rose-600 hover:bg-rose-950/40"
              }`}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-rose-900/20 to-transparent pointer-events-none rounded-2xl" />

            {loading === "exit" ? (
              <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-rose-900/60 border border-rose-700/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-rose-400 tracking-widest uppercase">
                  Exit
                </span>
                <span className="text-[10px] text-rose-700">Clock Out</span>
              </>
            )}
          </button>
        </div>

        {/* Status Message */}
        {msg && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2.5 border
            ${msgType === "success"
              ? "bg-emerald-950/60 border-emerald-800/50 text-emerald-400"
              : "bg-rose-950/60 border-rose-800/50 text-rose-400"
            }`}
          >
            <span className="text-base mt-0.5">
              {msgType === "success" ? "✓" : "⚠"}
            </span>
            <span>{msg}</span>
          </div>
        )}

        {/* Last Action Pill */}
        {lastAction && (
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-600">
            <span className={`w-1.5 h-1.5 rounded-full ${lastAction.type === "entry" ? "bg-emerald-600" : "bg-rose-600"}`} />
            Last {lastAction.type} at{" "}
            {lastAction.time.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </div>
        )}

      </div>
    </div>
  );
}