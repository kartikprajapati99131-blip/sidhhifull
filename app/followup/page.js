"use client";

import { useSession } from "next-auth/react";
import EntryManager from "@/components/EntryManager";

const ALLOWED_ROLES = ["admin", "sales", "subadmin", "staff"];

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="max-w-sm px-6 text-center">
        <p className="select-none text-8xl font-black leading-none text-slate-200">404</p>
        <p className="mb-4 mt-2 text-5xl">🚫</p>
        <h2 className="mb-2 text-xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-sm text-slate-500">You don't have permission to view this page.</p>
      </div>
    </div>
  );
}

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-indigo-500" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const ROLE_BADGE_CLASSES = {
  admin: "bg-sky-50 text-sky-600 border-sky-200",
  sales: "bg-emerald-50 text-emerald-600 border-emerald-200",
  subadmin: "bg-purple-50 text-purple-600 border-purple-200",
  staff: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function CustomersAndMistryPage() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={36} />
          <p className="text-sm font-medium text-slate-500">Loading your session…</p>
        </div>
      </div>
    );
  }

  if (!session || !ALLOWED_ROLES.includes(role)) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Customers &amp; Mistry</h1>
            <p className="mt-0.5 text-sm text-slate-400">{session.user.name || session.user.email}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.staff}`}>
            {role}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <EntryManager />
      </div>
    </div>
  );
}
