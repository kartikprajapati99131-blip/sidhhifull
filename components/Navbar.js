"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const [adminOpen, setAdminOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [mistryOpen, setMistryOpen] = useState(false);
  const dropRef = useRef(null);

  const isAdmin = session?.user?.role === "admin";
  const isStaff = session?.user?.role === "staff";
  const isMistry = session?.user?.role === "mistry";
  const isUser = session?.user?.role === "user";
  const isAccounts = session?.user?.role === "accounts";

  const adminSections = [
    {
      title: "Catalog",
      items: [
        { href: "/addproduct", label: "Add Product", dot: "bg-blue-500" },
        { href: "/products", label: "Products", dot: "bg-emerald-500" },
        { href: "/orders", label: "Orders", dot: "bg-amber-500" },
      ],
    },
    {
      title: "People",
      items: [
        { href: "/users", label: "All Users", dot: "bg-violet-500" },
        { href: "/customer", label: "Customer lead ", dot: "bg-sky-500" },
        { href: "/allattendance", label: "Attendance", dot: "bg-teal-500" },
        { href: "/add-customer", label: "Add Customer Data", dot: "bg-sky-500" },

      ],
    },
    {
      title: "Misc",
      items: [
        { href: "/allrewiew", label: "Reviews", dot: "bg-rose-500" },
        { href: "/question", label: "Questions", dot: "bg-slate-400" },
      ],
    },
  ];

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm z-50 sticky top-0">
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/s-black.svg"
            alt="Siddhi Interiors"
            width={130} height={104}
            priority
            className="h-8 w-auto"
          />
        </Link>

        {/* ── Right side ── */}
        <div className="flex items-center gap-3">

          {!session ? (
            /* Login button */
            <Link href="/login">
              <button className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow shadow-sky-200/70 transition-all duration-200 active:scale-95">
                Login
              </button>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">

              {/* Avatar + name */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Image
                    src={session.user.image || "/profile.png"}
                    width={34} height={34}
                    alt="User"
                    className="rounded-full ring-2 ring-white shadow-sm"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700 hidden md:block max-w-[100px] truncate capitalize">
                  {session.user.name}
                </span>
              </div>

              {/* ── USER role ── */}
              {isUser && (
                <div className="flex items-center gap-1.5">
                  <RolePill color="from-emerald-400 to-green-500" label="User" />
                  <GhostSignOut />
                </div>
              )}

              {/* ── STAFF role ── */}
              {isStaff && (
                <div className="relative">
                  <button
                    onClick={() => setStaffOpen((v) => !v)}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[12px] font-semibold shadow shadow-blue-200 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-200" />
                    Staff
                    <ChevronDown size={13} className={`transition-transform duration-200 ${staffOpen ? "rotate-180" : ""}`} />
                  </button>
                  {staffOpen && (
                    <DropPanel onClose={() => setStaffOpen(false)}>
                      {[
                        { href: `/profile/${session.user.id}`, label: "Profile", dot: "bg-slate-400" },
                        { href: "/orders", label: "Orders", dot: "bg-amber-500" },
                        { href: "/attandance", label: "Attendance", dot: "bg-teal-500" },
                        { href: "/customer", label: "Customers", dot: "bg-sky-500" },
                        { href: `/rewiew/${session.user.id}`, label: "Your Review", dot: "bg-rose-400" },
                      ].map((it) => (
                        <DropLink key={it.href} {...it} close={() => setStaffOpen(false)} />
                      ))}
                      <div className="h-px bg-slate-100 mx-2 my-1" />
                      <SignOutRow />
                    </DropPanel>
                  )}
                </div>
              )}

              {/* ── MISTRY role ── */}
              {isMistry && (
                <div className="relative">
                  <button
                    onClick={() => setMistryOpen((v) => !v)}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[12px] font-semibold shadow shadow-amber-200 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-200" />
                    Mistry
                    <ChevronDown size={13} className={`transition-transform duration-200 ${mistryOpen ? "rotate-180" : ""}`} />
                  </button>
                  {mistryOpen && (
                    <DropPanel onClose={() => setMistryOpen(false)}>
                      {[
                        { href: `/profile/${session.user.id}`, label: "Profile", dot: "bg-slate-400" },
                        { href: "/customer", label: "Customers", dot: "bg-sky-500" },
                      ].map((it) => (
                        <DropLink key={it.href} {...it} close={() => setMistryOpen(false)} />
                      ))}
                      <div className="h-px bg-slate-100 mx-2 my-1" />
                      <SignOutRow />
                    </DropPanel>
                  )}
                </div>
              )}

              {/* ── ADMIN role ── */}
              {isAdmin && (
                <div className="relative" ref={dropRef}>
                  <button
                    onClick={() => setAdminOpen((v) => !v)}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-[12px] font-semibold shadow shadow-red-200 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-200 animate-pulse" />
                    Admin
                    <ChevronDown size={13} className={`transition-transform duration-200 ${adminOpen ? "rotate-180" : ""}`} />
                  </button>

                  {adminOpen && (
                    <DropPanel onClose={() => setAdminOpen(false)}>
                      {adminSections.map((sec, si) => (
                        <React.Fragment key={sec.title}>
                          {si > 0 && <div className="h-px bg-slate-100 mx-2 my-1" />}
                          <p className="px-3 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {sec.title}
                          </p>
                          {sec.items.map((it) => (
                            <DropLink key={it.href} {...it} close={() => setAdminOpen(false)} />
                          ))}
                        </React.Fragment>
                      ))}
                      <div className="h-px bg-slate-100 mx-2 my-1" />
                      <SignOutRow />
                    </DropPanel>
                  )}
                </div>
              )}

              {isAccounts && (
                <div className="relative">
                  <button
                    onClick={() => setStaffOpen((v) => !v)}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 text-white text-[12px] font-semibold shadow shadow-orange-200 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-200" />
                    Staff
                    <ChevronDown size={13} className={`transition-transform duration-200 ${staffOpen ? "rotate-180" : ""}`} />
                  </button>
                  {staffOpen && (
                    <DropPanel onClose={() => setStaffOpen(false)}>
                      {[
                        { href: `/profile/${session.user.id}`, label: "Profile", dot: "bg-slate-400" },
                        { href: "/orders", label: "Orders", dot: "bg-amber-500" },
                        { href: "/attandance", label: "Attendance", dot: "bg-teal-500" },
                        { href: "/customer", label: "Customer leads", dot: "bg-sky-500" },
                        { href: "/add-customer", label: "Add Customer Data", dot: "bg-sky-500" },
                        { href: `/rewiew/${session.user.id}`, label: "Your Review", dot: "bg-rose-400" },
                      ].map((it) => (
                        <DropLink key={it.href} {...it} close={() => setStaffOpen(false)} />
                      ))}
                      <div className="h-px bg-slate-100 mx-2 my-1" />
                      <SignOutRow />
                    </DropPanel>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ── helpers ── */

function RolePill({ color, label }) {
  return (
    <span className={`inline-flex items-center bg-gradient-to-r ${color} text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm`}>
      {label}
    </span>
  );
}

function GhostSignOut() {
  return (
    <button
      onClick={() => signOut()}
      className="text-[11px] font-medium text-slate-500 hover:text-red-500 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-all duration-150"
    >
      Sign out
    </button>
  );
}

function DropPanel({ children, onClose }) {
  return (
    <div
      className="absolute top-[calc(100%+8px)] right-0 w-52 rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/80 overflow-hidden z-[9999] py-2"
      onMouseLeave={onClose}
    >
      {children}
    </div>
  );
}

function DropLink({ href, dot, label, close }) {
  return (
    <Link
      href={href}
      onClick={close}
      className="flex items-center gap-2.5 px-3 py-2 mx-1 rounded-xl text-[13px] text-slate-700 font-medium hover:bg-slate-50 hover:text-sky-600 transition-colors"
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </Link>
  );
}

function SignOutRow() {
  return (
    <button
      onClick={() => signOut()}
      className="flex items-center gap-2.5 w-full px-3 py-2 mx-1 rounded-xl text-[13px] text-red-500 font-medium hover:bg-red-50 transition-colors"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
      Sign out
    </button>
  );
}