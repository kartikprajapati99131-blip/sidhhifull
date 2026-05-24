"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import * as XLSX from "xlsx";  // ← ADD THIS IMPORT (npm install xlsx if not installed)

// ─── Role badge styles ─────────────────────────────────────────────────────────
const ROLE_STYLES = {
    admin: "bg-violet-100 text-violet-700",
    staff: "bg-emerald-100 text-emerald-700",
    mistry: "bg-amber-100 text-amber-700",
    user: "bg-sky-100 text-sky-700",
    architect: "bg-rose-100 text-rose-700",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });
}

function getDateGroup(iso) {
    if (!iso) return "Unknown Date";
    const date = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (date >= startOfToday) return "Today";
    if (date >= startOfYesterday) return "Yesterday";
    if (date >= startOfWeek) return "This Week";
    if (date >= startOfMonth) return "This Month";
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function dateGroupSortKey(label) {
    const order = { "Today": 0, "Yesterday": 1, "This Week": 2, "This Month": 3 };
    if (label in order) return order[label];
    const d = new Date(label);
    return isNaN(d) ? 999 : -d.getTime();
}

function groupByDate(list) {
    const map = {};
    for (const c of list) {
        const label = getDateGroup(c.createdAt);
        if (!map[label]) map[label] = [];
        map[label].push(c);
    }
    return Object.entries(map)
        .sort(([a], [b]) => dateGroupSortKey(a) - dateGroupSortKey(b))
        .map(([label, customers]) => ({ label, customers }));
}

// ─── Export helpers ────────────────────────────────────────────────────────────
function buildRows(customers) {
    return customers.map((c) => ({
        "Name":       c.name || "",
        "Phone":      c.phone || "",
        "Address":    c.address || "",
        "Notes":      c.notes || "",
        "Added By":   c.addedByName || "",
        "Role":       c.addedByRole || "",
        "Added On":   formatDate(c.createdAt),
    }));
}

function exportExcel(customers) {
    const rows = buildRows(customers);
    const ws   = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
        { wch: 25 }, { wch: 15 }, { wch: 35 },
        { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `customers_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportCSV(customers) {
    const rows = buildRows(customers);
    const ws   = XLSX.utils.json_to_sheet(rows);
    const csv  = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `customers_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Export Button (dropdown) ──────────────────────────────────────────────────
function ExportButton({ customers }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition flex-shrink-0"
            >
                ⬇️ Export
                <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-lg z-20 overflow-hidden">
                    <button
                        onClick={() => { exportExcel(customers); setOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
                    >
                        📊 Download Excel
                    </button>
                    <div className="h-px bg-gray-100 mx-3" />
                    <button
                        onClick={() => { exportCSV(customers); setOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
                    >
                        📄 Download CSV
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Add Customer Modal ────────────────────────────────────────────────────────
function AddCustomerModal({ onClose, onSave }) {
    const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const handleSave = async () => {
        if (!form.name.trim()) return setErr("Name is required.");
        if (!form.phone.trim()) return setErr("Phone number is required.");
        setSaving(true); setErr("");
        try {
            const res = await fetch("/api/customer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");
            onSave(data?.customer || data);
        } catch (e) { setErr(e.message || "Could not save. Please try again.");
        } finally { setSaving(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-black text-gray-900">Add Customer</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition text-xl">×</button>
                </div>
                <div className="flex flex-col gap-4">
                    <Field label="Full Name *"><input type="text" placeholder="e.g. Rahul Shah" value={form.name} onChange={set("name")} className="input-base" /></Field>
                    <Field label="Phone Number *"><input type="tel" placeholder="e.g. 9876543210" value={form.phone} onChange={set("phone")} className="input-base" /></Field>
                    <Field label="Address"><textarea placeholder="e.g. 12, Rander Road, Surat 395009" value={form.address} onChange={set("address")} rows={2} className="input-base resize-none" /></Field>
                    <Field label="Notes / Remarks"><textarea placeholder="Any extra info..." value={form.notes} onChange={set("notes")} rows={2} className="input-base resize-none" /></Field>
                    {err && <p className="text-xs text-rose-500 font-medium">{err}</p>}
                    <div className="flex gap-3 mt-1">
                        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex-1 bg-gray-900 rounded-xl py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition disabled:opacity-50">{saving ? "Saving..." : "Save Customer"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Customer Modal ───────────────────────────────────────────────────────
function EditCustomerModal({ customer, onClose, onSave }) {
    const [form, setForm] = useState({ name: customer.name || "", phone: customer.phone || "", address: customer.address || "", notes: customer.notes || "" });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const handleSave = async () => {
        if (!form.name.trim()) return setErr("Name is required.");
        if (!form.phone.trim()) return setErr("Phone number is required.");
        setSaving(true); setErr("");
        try {
            const res = await fetch(`/api/customer/${customer._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");
            onSave(data?.customer || data);
        } catch (e) { setErr(e.message || "Could not update. Please try again.");
        } finally { setSaving(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-black text-gray-900">Edit Customer</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition text-xl">×</button>
                </div>
                <div className="flex flex-col gap-4">
                    <Field label="Full Name *"><input type="text" value={form.name} onChange={set("name")} className="input-base" /></Field>
                    <Field label="Phone Number *"><input type="tel" value={form.phone} onChange={set("phone")} className="input-base" /></Field>
                    <Field label="Address"><textarea value={form.address} onChange={set("address")} rows={2} className="input-base resize-none" /></Field>
                    <Field label="Notes / Remarks"><textarea value={form.notes} onChange={set("notes")} rows={2} className="input-base resize-none" /></Field>
                    {err && <p className="text-xs text-rose-500 font-medium">{err}</p>}
                    <div className="flex gap-3 mt-1">
                        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex-1 bg-gray-900 rounded-xl py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition disabled:opacity-50">{saving ? "Saving..." : "Update Customer"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Customer Detail Modal ─────────────────────────────────────────────────────
function CustomerDetailModal({ customer, isAdmin, onClose, onDelete, onEditOpen }) {
    const [deleting, setDeleting] = useState(false);
    const handleDelete = async () => {
        if (!confirm(`Remove ${customer.name}? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/customer/${customer._id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            onDelete(customer._id); onClose();
        } catch { alert("Could not delete. Try again."); setDeleting(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-black text-gray-900">Customer Details</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition text-xl">×</button>
                </div>
                <div className="flex items-center gap-4 mb-5">
                    <Avatar name={customer.name} size="lg" />
                    <div>
                        <p className="text-lg font-black text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-400">Added {formatDate(customer.createdAt)}</p>
                    </div>
                </div>
                <div className="flex flex-col gap-2 mb-5">
                    <DetailRow icon="📞" label="Phone" value={customer.phone} />
                    <DetailRow icon="📍" label="Address" value={customer.address} />
                    <DetailRow icon="📝" label="Notes" value={customer.notes} />
                    {isAdmin && customer.addedByName && (
                        <DetailRow icon="👤" label="Added by" value={
                            <span className="flex items-center gap-2">
                                {customer.addedByName}
                                {customer.addedByRole && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${ROLE_STYLES[customer.addedByRole] || "bg-gray-100 text-gray-600"}`}>{customer.addedByRole}</span>
                                )}
                            </span>
                        } />
                    )}
                </div>
                {isAdmin && (
                    <div className="flex gap-3">
                        <button onClick={() => { onClose(); onEditOpen(customer); }} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">✏️ Edit</button>
                        <button onClick={handleDelete} disabled={deleting} className="flex-1 border border-rose-200 text-rose-500 rounded-xl py-2.5 text-sm font-semibold hover:bg-rose-50 transition disabled:opacity-50">{deleting ? "Removing..." : "🗑 Delete"}</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Small reusable helpers ────────────────────────────────────────────────────
function Field({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
            {children}
        </div>
    );
}
function DetailRow({ icon, label, value }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-base mt-0.5 flex-shrink-0">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <div className="text-sm text-gray-800 mt-0.5 leading-relaxed break-words">{value}</div>
            </div>
        </div>
    );
}
function Avatar({ name, size = "md" }) {
    const sz = size === "lg" ? "w-14 h-14 text-2xl" : size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";
    return (
        <div className={`${sz} rounded-full bg-gray-900 flex items-center justify-center text-white font-black flex-shrink-0`}>
            {name?.[0]?.toUpperCase() || "?"}
        </div>
    );
}
function CustomerCard({ customer, isAdmin, onClick }) {
    return (
        <button onClick={onClick} className="w-full text-left bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-gray-200 transition flex items-center gap-4">
            <Avatar name={customer.name} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 truncate">{customer.name}</p>
                    {isAdmin && customer.addedByRole && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${ROLE_STYLES[customer.addedByRole] || "bg-gray-100 text-gray-600"}`}>{customer.addedByRole}</span>
                    )}
                </div>
                {customer.phone && <p className="text-xs text-gray-400 mt-0.5">📞 {customer.phone}</p>}
                {customer.address && <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {customer.address}</p>}
                {isAdmin && customer.addedByName && <p className="text-xs text-gray-300 mt-0.5 truncate">by {customer.addedByName}</p>}
            </div>
            <span className="text-gray-300 text-lg flex-shrink-0">›</span>
        </button>
    );
}
function DateGroupHeader({ label, count }) {
    return (
        <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">📅 {label}</span>
            <span className="text-xs text-gray-400">{count} customer{count !== 1 ? "s" : ""}</span>
            <div className="flex-1 h-px bg-gray-100" />
        </div>
    );
}
function EmptyState({ search, onAdd }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-16 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-sm font-semibold text-gray-700">{search ? "No customers match your search." : "No customers yet."}</p>
            {!search && (
                <>
                    <p className="text-xs text-gray-400 mt-1 mb-4">Add your first customer to get started.</p>
                    <button onClick={onAdd} className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition">
                        <span className="text-lg leading-none">+</span> Add Customer
                    </button>
                </>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CustomersPage() {
    const { data: session, status } = useSession();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCustomer, setSelected] = useState(null);
    const [editingCustomer, setEditing] = useState(null);
    const [search, setSearch] = useState("");

    const isAdmin = session?.user?.role === "admin";
    const userRole = session?.user?.role || "";

    useEffect(() => {
        if (status !== "authenticated") return;
        (async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/customer");
                if (res.ok) { const data = await res.json(); setCustomers(Array.isArray(data) ? data : []); }
            } catch { } finally { setLoading(false); }
        })();
    }, [status]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-7 h-7 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }
    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-400">
                <p className="text-4xl">🔒</p>
                <p className="text-sm">Please sign in to view customers.</p>
                <Link href="/login" className="text-sm text-gray-900 underline">Sign In</Link>
            </div>
        );
    }

    const filtered = customers.filter((c) => {
        const q = search.toLowerCase();
        return c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.address?.toLowerCase().includes(q) || c.notes?.toLowerCase().includes(q) || c.addedByName?.toLowerCase().includes(q);
    });

    const dateGroups = groupByDate(filtered);

    return (
        <div className="min-h-screen bg-gray-50">

            {showAddModal && (
                <AddCustomerModal onClose={() => setShowAddModal(false)} onSave={(c) => { setCustomers((prev) => [c, ...prev]); setShowAddModal(false); }} />
            )}
            {selectedCustomer && !editingCustomer && (
                <CustomerDetailModal customer={selectedCustomer} isAdmin={isAdmin} onClose={() => setSelected(null)} onDelete={(id) => setCustomers((prev) => prev.filter((c) => c._id !== id))} onEditOpen={(c) => { setSelected(null); setEditing(c); }} />
            )}
            {editingCustomer && (
                <EditCustomerModal customer={editingCustomer} onClose={() => setEditing(null)} onSave={(updated) => { setCustomers((prev) => prev.map((c) => (c._id === updated._id ? updated : c))); setEditing(null); }} />
            )}

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition mb-6">← Back</Link>

                {/* HEADER */}
                <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Customers</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {isAdmin ? `All customers · ${customers.length} total` : `Your customers · ${customers.length} added`}
                        </p>
                        {!isAdmin && userRole && (
                            <span className={`mt-2 inline-block text-xs font-bold px-3 py-1 rounded-full capitalize ${ROLE_STYLES[userRole] || "bg-gray-100 text-gray-600"}`}>{userRole}</span>
                        )}
                    </div>

                    {/* ── Buttons row ── */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Export — admin only, only when there's data */}
                        {isAdmin && customers.length > 0 && (
                            <ExportButton customers={customers} />
                        )}
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-700 transition"
                        >
                            <span className="text-lg leading-none">+</span>
                            Add Customer
                        </button>
                    </div>
                </div>

                {isAdmin && (
                    <div className="mb-4 flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-600 text-xs font-bold px-4 py-2.5 rounded-xl">
                        <span>👑</span>
                        <span>Admin view — showing all customers from all staff</span>
                    </div>
                )}

                {isAdmin && (
                    <div className="relative mb-5">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
                        <input type="text" placeholder="Search by name, phone, address or staff..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full border border-gray-200 bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-300 shadow-sm" />
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Loading customers...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState search={search} onAdd={() => setShowAddModal(true)} />
                ) : (
                    <div className="flex flex-col gap-8">
                        {dateGroups.map(({ label, customers: group }) => (
                            <div key={label}>
                                <DateGroupHeader label={label} count={group.length} />
                                <div className="flex flex-col gap-3">
                                    {group.map((c) => (
                                        <CustomerCard key={c._id} customer={c} isAdmin={isAdmin} onClick={() => setSelected(c)} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .input-base { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.625rem 1rem; font-size: 0.875rem; color: #111827; outline: none; }
                .input-base:focus { box-shadow: 0 0 0 2px #111827; }
                .input-base::placeholder { color: #d1d5db; }
            `}</style>
        </div>
    );
}