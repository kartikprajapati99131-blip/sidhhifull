"use client";

import { useSession } from "next-auth/react";
import CompletedComplaints from "@/components/CompletedComplaints";

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <p className="text-8xl font-black text-slate-200 select-none leading-none">404</p>
        <p className="text-5xl mt-2 mb-4">🚫</p>
        <h2 className="font-bold text-slate-800 text-xl mb-2">Page Not Found</h2>
        <p className="text-slate-500 text-sm">You don&apos;t have permission to view this page.</p>
      </div>
    </div>
  );
}

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-sky-500" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function CompletedComplaintsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={36} />
          <p className="text-slate-500 text-sm font-medium">Loading your session…</p>
        </div>
      </div>
    );
  }

  const role = session?.user?.role;

  if (!session || !["admin", "subadmin", "collection", "staff"].includes(role)) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Completed Complaints</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {session?.user?.name || session?.user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <CompletedComplaints />
      </div>
    </div>
  );
}
