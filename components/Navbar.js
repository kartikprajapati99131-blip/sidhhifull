"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
// import { isAdmin } from "@/action/useraction";

const Navbar = ({ }) => {
    const { data: session, status } = useSession();
    const [showDropdown, setshowDropdown] = useState(false)
    const [currentUser, setcurrentUser] = useState({})
    const isAdmin = session?.user?.role === "admin";
    const isStaff = session?.user?.role === "staff";
    const isMistry = session?.user?.role === "mistry";
    const isArcitect = session?.user?.role === "architect";
    const isUser = session?.user?.role === "user";


    const dropdownRef = useRef(null);
    return (
        <nav className="bg-gray-300 text-white min-h-[8vh] z-100 flex justify-between items-center px-6  shadow-md  ">

            {/* Logo */}
            <Link href="/" className="flex items-center">
                <Image
                    src="/s-black.svg"
                    alt="Siddhi logo"
                    width={150}
                    height={120}
                    priority
                    className="h-auto w-40"
                />
            </Link>

            {/* Right Side */}
            <div className="flex items-center gap-5">

                {session ? (
                    <>
                        {/* User Info */}
                        <div className="flex items-center gap-3">

                            <Image
                                src={session.user.image || "/profile.png"}
                                width={40}
                                height={40}
                                alt="User"
                                className="rounded-full border"
                            />

                            <div className="flex flex-col leading-tight">
                                <span className="text-sm capitalize font-medium text-black hidden md:block">
                                    {session.user.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    {/* {isAdmin === true && (
                                        <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full text-white w-fit">
                                            Admin
                                        </span>

                                    )} */}
                                    {isUser === true && (<>
                                        <div className="flex items-center gap-2 max-md:flex-col" >

                                            <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full text-white w-fit">User</span>
                                            <button onClick={() => { signOut() }} className="text-xs bg-green-500 px-2 py-0.5 rounded-full text-white w-fit">Sign out</button>
                                        </div>

                                    </>
                                    )}

                                    {isAdmin === true && (
                                        <div className="relative flex items-center gap-2">

                                            {/* Admin badge */}
                                            <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full select-none">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-300 inline-block" />
                                                Admin
                                            </div>

                                            {/* Chevron trigger */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setshowDropdown(!showDropdown)}
                                                    className={`w-7 h-7 flex items-center justify-center rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition-colors`}
                                                >
                                                    <svg
                                                        className={`w-3.5 h-3.5 text-black transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                                                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                    >
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                </button>

                                                {/* Dropdown */}
                                                {showDropdown && (
                                                    <div
                                                        className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden z-50"
                                                        onMouseLeave={() => setshowDropdown(false)}
                                                    >
                                                        {/* Catalog */}
                                                        <div className="p-1.5">
                                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2.5 pt-1.5 pb-1">Catalog</p>
                                                            <Link href="/addproduct" onClick={() => setshowDropdown(false)}
                                                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                                <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-500 font-bold text-base leading-none">+</span>
                                                                Add product
                                                            </Link>
                                                            <a href="/products" onClick={() => setshowDropdown(false)}
                                                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                                <span className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                                                                </span>
                                                                Products
                                                            </a>
                                                            <a href="/orders" onClick={() => setshowDropdown(false)}
                                                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                                <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                                                                </span>
                                                                Orders
                                                            </a>
                                                        </div>

                                                        <div className="border-t border-gray-100 dark:border-gray-800 mx-2" />

                                                        {/* People */}
                                                        <div className="p-1.5">
                                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2.5 pt-1.5 pb-1">People</p>
                                                            <a href="/users" onClick={() => setshowDropdown(false)}
                                                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                                <span className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                                                                </span>
                                                                All users
                                                            </a>
                                                            <Link href="/customer" onClick={() => setshowDropdown(false)}
                                                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                                <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                                                                </span>
                                                                Customer's Data
                                                            </Link>
                                                            <a href="/allattendance" onClick={() => setshowDropdown(false)}
                                                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                                <span className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                                                </span>
                                                                Attendance
                                                            </a>
                                                        </div>

                                                        <div className="border-t border-gray-100 dark:border-gray-800 mx-2" />

                                                        {/* Misc */}
                                                        <div className="p-1.5">
                                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2.5 pt-1.5 pb-1">Misc</p>
                                                            <a href="/allrewiew" onClick={() => setshowDropdown(false)}
                                                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                                <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                                </span>
                                                                Reviews
                                                            </a>
                                                            <Link href="/question" onClick={() => setshowDropdown(false)}
                                                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                                <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                                </span>
                                                                Questions
                                                            </Link>
                                                        </div>

                                                        <div className="border-t border-gray-100 dark:border-gray-800 mx-2" />

                                                        {/* Sign out */}
                                                        <div className="p-1.5">
                                                            <button
                                                                onClick={() => { signOut(); setshowDropdown(false); }}
                                                                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                            >
                                                                <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                                                </span>
                                                                Sign out
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {isMistry === true && (
                                        < >
                                            <div className="flex items-center gap-2">

                                                <button onClick={() => setshowDropdown(!showDropdown)} className=" flex items-center gap-2 text-xs bg-amber-500 px-2 py-0.5 rounded-full text-white w-fit">
                                                    Mistry
                                                </button>
                                                <div
                                                    className="relative">
                                                    <button onClick={() => setshowDropdown(!showDropdown)} data-dropdown-toggle="dropdown" className="inline-flex items-center justify-center text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-2 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base  focus:outline-none" type="button">
                                                        <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" /></svg>
                                                    </button>

                                                    <div className="relative z-10" onClick={() => setshowDropdown(false)} onMouseLeave={() => setshowDropdown(false)}>
                                                        <div id="dropdown" className={`absolute ${showDropdown ? "" : "hidden"} py-4 mt-2 right-0   bg-gray-800 border border rounded-2xl rounded-base shadow-lg w-44`}>
                                                            <ul className="p-2 text-sm text-body font-medium" aria-labelledby="dropdownDefaultButton">
                                                                <li>
                                                                    <a href={`/profile/${session?.user.id}`} className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Profile</a>
                                                                </li>
                                                                <li>
                                                                    <Link href="/customer" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Custumers</Link>
                                                                </li>                                                                <li>
                                                                    <button onClick={() => { signOut() }} className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Sign out</button>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>

                                                </div>

                                            </div>
                                        </>
                                    )}
                                    {isStaff === true && (
                                        < >
                                            <div className="flex items-center gap-2">

                                                <button onClick={() => setshowDropdown(!showDropdown)} className=" flex items-center gap-2 text-xs bg-blue-500 px-2 py-0.5 rounded-full text-white w-fit">
                                                    Staff
                                                </button>
                                                <div
                                                    className="relative">
                                                    <button onClick={() => setshowDropdown(!showDropdown)} data-dropdown-toggle="dropdown" className="inline-flex items-center justify-center text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-2 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base  focus:outline-none" type="button">
                                                        <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" /></svg>
                                                    </button>

                                                    <div className="relative z-10" onClick={() => setshowDropdown(false)} onMouseLeave={() => setshowDropdown(false)}>
                                                        <div id="dropdown" className={`absolute ${showDropdown ? "" : "hidden"} py-4 mt-2 right-0   bg-gray-800 border border rounded-2xl rounded-base shadow-lg w-44`}>
                                                            <ul className="p-2 text-sm text-body font-medium" aria-labelledby="dropdownDefaultButton">
                                                                <li>
                                                                    <a href={`/profile/${session?.user.id}`} className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Profile</a>
                                                                </li>
                                                                <li>
                                                                    <a href="/orders" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Orders</a>
                                                                </li>
                                                                <li>
                                                                    <a href="/attandance" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Attandance</a>
                                                                </li>
                                                                <li>
                                                                    <Link href="/customer" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Custumers</Link>
                                                                </li>
                                                                <li>
                                                                    <Link href={`/rewiew/${session?.user?.id}`} className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">
                                                                        Your Review
                                                                    </Link>
                                                                </li>

                                                                <li>
                                                                    <button onClick={() => { signOut() }} className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Sign out</button>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>

                                                </div>

                                            </div>
                                        </>
                                    )}

                                </div>
                            </div>
                        </div>

                        {/* Logout */}




                    </>
                ) : (
                    <>
                        {/* Login */}
                        <Link href="/login">
                            <button className="bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition px-4 py-2 rounded-lg text-sm font-medium">
                                Login
                            </button>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;