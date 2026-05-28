"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const EMPTY_FORM = {
  mobile1: "", mobile2: "", category: "",
  firstName: "", middleName: "", lastName: "",
  address1: "", address2: "", area: "",
  city: "", district: "", state: "", pincode: "",
  bloodGroup: "", religion: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const cap = (v) => (typeof v === "string" ? v.toUpperCase() : v);

// ── Shared UI ────────────────────────────────────────────────────────────────
function Field({ label, required, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent " +
  "placeholder:text-slate-300 transition uppercase";

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-sky-500" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── 404 Page ─────────────────────────────────────────────────────────────────
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <p className="text-8xl font-black text-slate-200 select-none leading-none">404</p>
        <p className="text-5xl mt-2 mb-4">🚫</p>
        <h2 className="font-bold text-slate-800 text-xl mb-2">Page Not Found</h2>
        <p className="text-slate-500 text-sm">
          You don't have permission to view this page, or this page doesn't exist.
        </p>
      </div>
    </div>
  );
}

// ── Customer Detail / Edit Popup ─────────────────────────────────────────────
function CustomerPopup({ customer: initialCustomer, onClose, onDeleted, onUpdated, isAdmin }) {
  const [customer, setCustomer] = useState(initialCustomer);
  const [editing,  setEditing]  = useState(false);
  const [draft,    setDraft]    = useState({ ...initialCustomer });
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");

  const setD = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const setDCap = (k, v) => setDraft(d => ({ ...d, [k]: cap(v) }));

  async function handleDelete() {
    if (!confirm("Delete this customer permanently?")) return;
    setDeleting(true);
    const res = await fetch(`/api/customers/${customer._id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) { onDeleted(); onClose(); }
    else alert("Delete failed.");
  }

  async function handleSave() {
    setSaveError("");
    if (!draft.firstName?.trim()) { setSaveError("First name is required."); return; }
    if (!draft.lastName?.trim())  { setSaveError("Last name is required."); return; }

    setSaving(true);
    const res  = await fetch(`/api/customers/${customer._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      const updated = data.customer || { ...customer, ...draft };
      setCustomer(updated);
      setDraft({ ...updated });
      setEditing(false);
      if (onUpdated) onUpdated(updated);
    } else {
      setSaveError(data.error || "Save failed.");
    }
  }

  function handleCancelEdit() {
    setDraft({ ...customer });
    setEditing(false);
    setSaveError("");
  }

  // ── Read-only row ───────────────────────────────────────────────────────────
  const Row = ({ label, value }) =>
    value ? (
      <div className="flex gap-2 py-1.5 border-b border-slate-100 last:border-0">
        <span className="text-xs text-slate-400 w-28 shrink-0 pt-0.5">{label}</span>
        <span className="text-sm text-slate-700 font-medium uppercase">{value}</span>
      </div>
    ) : null;

  // ── Edit input inside popup ─────────────────────────────────────────────────
  const popupInputCls =
    "w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent uppercase transition";

  const EField = ({ label, field, type = "text", maxLen }) => (
    <div className="flex gap-2 py-1.5 border-b border-slate-100 last:border-0 items-center">
      <span className="text-xs text-slate-400 w-28 shrink-0">{label}</span>
      {type === "select-blood" ? (
        <select
          value={draft[field] || ""}
          onChange={e => setD(field, e.target.value)}
          className={popupInputCls}
        >
          {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b || "— Select —"}</option>)}
        </select>
      ) : (
        <input
          type={type}
          inputMode={type === "tel" ? "numeric" : undefined}
          maxLength={maxLen}
          value={draft[field] || ""}
          onChange={e => setDCap(field, e.target.value)}
          className={popupInputCls}
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${editing ? "bg-amber-500" : "bg-sky-500"}`}>
          <div>
            <p className={`text-xs uppercase tracking-widest mb-0.5 ${editing ? "text-amber-100" : "text-sky-100"}`}>
              {editing ? "Editing Customer" : "Customer Found"}
            </p>
            <h2 className="text-lg font-bold text-white uppercase">
              {customer.firstName} {customer.middleName} {customer.lastName}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {!editing && customer.category && (
            <span className="inline-block mb-3 px-2.5 py-1 bg-sky-50 text-sky-600 rounded-full text-xs font-semibold border border-sky-200 uppercase">
              {customer.category}
            </span>
          )}

          {editing ? (
            <div className="space-y-0.5">
              <EField label="Category"         field="category" />
              <EField label="First Name"       field="firstName" />
              <EField label="Middle Name"      field="middleName" />
              <EField label="Last Name"        field="lastName" />
              <EField label="Primary Mobile"   field="mobile1" type="tel" maxLen={10} />
              <EField label="Secondary Mobile" field="mobile2" type="tel" maxLen={10} />
              <EField label="Address 1"        field="address1" />
              <EField label="Address 2"        field="address2" />
              <EField label="Area"             field="area" />
              <EField label="City"             field="city" />
              <EField label="District"         field="district" />
              <EField label="State"            field="state" />
              <EField label="Pincode"          field="pincode" maxLen={6} />
              <EField label="Blood Group"      field="bloodGroup" type="select-blood" />
              <EField label="Religion"         field="religion" />
              {saveError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{saveError}</p>
              )}
            </div>
          ) : (
            <>
              <Row label="Primary Mobile"   value={customer.mobile1} />
              <Row label="Secondary Mobile" value={customer.mobile2} />
              <Row label="Address 1"        value={customer.address1} />
              <Row label="Address 2"        value={customer.address2} />
              <Row label="Area"             value={customer.area} />
              <Row label="City"             value={customer.city} />
              <Row label="District"         value={customer.district} />
              <Row label="State"            value={customer.state} />
              <Row label="Pincode"          value={customer.pincode} />
              <Row label="Blood Group"      value={customer.bloodGroup} />
              <Row label="Religion"         value={customer.religion} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 flex justify-between items-center border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Added {new Date(customer.createdAt).toLocaleDateString("en-IN")}
          </p>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition disabled:opacity-60 flex items-center gap-1.5"
                >
                  {saving && <Spinner size={13} />}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </>
                )}
                <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Export Bar (Admin only) ──────────────────────────────────────────────────
function ExportBar() {
  const [category,   setCategory]   = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [religion,   setReligion]   = useState("");
  const [city,       setCity]       = useState("");
  const [name,       setName]       = useState("");
  const [fields,     setFields]     = useState("full");
  const [loading,    setLoading]    = useState(null);

  function buildQS() {
    const p = new URLSearchParams();
    if (category)   p.set("category",   category);
    if (bloodGroup) p.set("bloodGroup", bloodGroup);
    if (religion)   p.set("religion",   religion);
    if (city)       p.set("city",       city);
    if (name)       p.set("name",       name);
    p.set("fields", fields);
    return p.toString();
  }

  async function handleExport(format) {
    setLoading(format);
    window.location.href = `/api/customers/export?format=${format}&${buildQS()}`;
    setTimeout(() => setLoading(null), 2500);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
        Export Customers
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <input placeholder="Category filter" value={category} onChange={e => setCategory(cap(e.target.value))} className={inputCls} />
        <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className={inputCls}>
          <option value="">All Blood Groups</option>
          {BLOOD_GROUPS.filter(Boolean).map(b => <option key={b}>{b}</option>)}
        </select>
        <input placeholder="Religion filter" value={religion} onChange={e => setReligion(cap(e.target.value))} className={inputCls} />
        <input placeholder="City filter"     value={city}     onChange={e => setCity(cap(e.target.value))}     className={inputCls} />
        <input placeholder="Name filter"     value={name}     onChange={e => setName(cap(e.target.value))}     className={inputCls} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
          {[["full","Full Details"],["namephone","Name & Phone Only"]].map(([val, lbl], i) => (
            <button key={val} onClick={() => setFields(val)}
              className={`px-3 py-1.5 font-medium transition ${i > 0 ? "border-l border-slate-200" : ""} ${fields === val ? "bg-sky-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
              {lbl}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {[["csv","CSV","📄"],["excel","Excel","📊"],["pdf","PDF","📑"]].map(([fmt, lbl, icon]) => (
            <button key={fmt} onClick={() => handleExport(fmt)} disabled={!!loading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition disabled:opacity-60">
              {loading === fmt ? <Spinner size={14} /> : <span>{icon}</span>}
              {lbl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Customer Table ───────────────────────────────────────────────────────────
function CustomerTable({ customers, page, total, isAdmin, onView, onPageChange }) {
  if (customers.length === 0) {
    return <p className="text-center text-slate-400 text-sm py-10">No customers found.</p>;
  }
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
        <p className="text-sm text-slate-500">
          Showing <strong>{customers.length}</strong> of <strong>{total}</strong> customers
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              {["#", "Name", "Mobile 1", "Mobile 2", "City", "Blood Group", "Religion", ""].map(h => (
                <th key={h} className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={c._id} className="border-t border-slate-100 hover:bg-sky-50/40 transition">
                <td className="px-4 py-2.5 text-slate-400">{(page - 1) * 20 + i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap uppercase">
                  {c.firstName} {c.middleName} {c.lastName}
                  {c.category && (
                    <span className="ml-2 px-1.5 py-0.5 bg-violet-50 text-violet-500 rounded text-xs border border-violet-200 uppercase">{c.category}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{c.mobile1}</td>
                <td className="px-4 py-2.5 text-slate-400">{c.mobile2 || "—"}</td>
                <td className="px-4 py-2.5 text-slate-600 uppercase">{c.city || "—"}</td>
                <td className="px-4 py-2.5">
                  {c.bloodGroup
                    ? <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-200">{c.bloodGroup}</span>
                    : "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-600 uppercase">{c.religion || "—"}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => onView(c)}
                    className="px-3 py-1 rounded-lg bg-sky-50 text-sky-600 text-xs font-semibold hover:bg-sky-100 border border-sky-200 transition">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 20 && (
        <div className="px-5 py-3 border-t border-slate-100 flex gap-2 justify-end items-center">
          <button disabled={page === 1} onClick={() => onPageChange(page - 1)}
            className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-slate-50">← Prev</button>
          <span className="px-3 py-1 text-sm text-slate-600">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => onPageChange(page + 1)}
            className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-slate-50">Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Search Panel ─────────────────────────────────────────────────────────────
function SearchPanel({ isAdmin }) {
  const [filters, setFilters] = useState({ search: "", bloodGroup: "", religion: "", city: "", name: "" });
  const [customers, setCustomers] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [popup,     setPopup]     = useState(null);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  useEffect(() => { doSearch(1, {}); }, []);

  async function doSearch(p = 1, overrideFilters) {
    setLoading(true);
    const f = overrideFilters ?? filters;
    const qs = new URLSearchParams({ ...f, page: p, limit: 20 });
    const res  = await fetch(`/api/customers?${qs}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setTotal(data.total || 0);
    setPage(p);
    setLoading(false);
  }

  function handleSearch() { doSearch(1); }

  function handleReset() {
    const empty = { search: "", bloodGroup: "", religion: "", city: "", name: "" };
    setFilters(empty);
    doSearch(1, empty);
  }

  // Update the popup customer in-place after an edit
  function handleUpdated(updated) {
    setCustomers(cs => cs.map(c => c._id === updated._id ? updated : c));
    setPopup(updated);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Search Customers
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <input placeholder="Name / Mobile / City…" value={filters.search}
            onChange={e => setF("search", cap(e.target.value))}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className={`${inputCls} col-span-2 sm:col-span-1`} />
          <input placeholder="Name" value={filters.name}
            onChange={e => setF("name", cap(e.target.value))}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className={inputCls} />
          <select value={filters.bloodGroup} onChange={e => setF("bloodGroup", e.target.value)} className={inputCls}>
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.filter(Boolean).map(b => <option key={b}>{b}</option>)}
          </select>
          <input placeholder="Religion" value={filters.religion}
            onChange={e => setF("religion", cap(e.target.value))}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className={inputCls} />
          <input placeholder="City" value={filters.city}
            onChange={e => setF("city", cap(e.target.value))}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className={inputCls} />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSearch}
            className="px-6 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition">
            Search
          </button>
          <button onClick={handleReset}
            className="px-6 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition">
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : (
        <CustomerTable
          customers={customers}
          page={page}
          total={total}
          isAdmin={isAdmin}
          onView={setPopup}
          onPageChange={p => doSearch(p)}
        />
      )}

      {popup && (
        <CustomerPopup
          customer={popup}
          isAdmin={isAdmin}
          onClose={() => setPopup(null)}
          onDeleted={() => doSearch(page)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}

// ── Add Form ─────────────────────────────────────────────────────────────────
function AddForm({ isAdmin, userEmail }) {
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [mob1Status, setMob1Status] = useState("idle");
  const [mob2Status, setMob2Status] = useState("idle");
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [showPopup,  setShowPopup]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");

  const debounce1 = useRef(null);
  const debounce2 = useRef(null);

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setCap = (k, v) => setForm(f => ({ ...f, [k]: cap(v) }));
  const showForm = mob1Status === "new";

  const checkMobile = useCallback((mobile, field) => {
    const ref       = field === "mobile1" ? debounce1 : debounce2;
    const setStatus = field === "mobile1" ? setMob1Status : setMob2Status;

    clearTimeout(ref.current);
    if (!mobile || mobile.length !== 10) { setStatus("idle"); return; }

    setStatus("checking");
    ref.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/customers/check?mobile=${mobile}`);
        const data = await res.json();
        if (data.found) {
          setStatus("exists");
          if (field === "mobile1") { setMatchedCustomer(data.customer); setShowPopup(true); }
        } else {
          setStatus("new");
        }
      } catch { setStatus("idle"); }
    }, 600);
  }, []);

  function handleMobileChange(field, value) {
    const v = value.replace(/\D/g, "").slice(0, 10);
    set(field, v);
    if (field === "mobile1") { setMob1Status("idle"); setError(""); }
    checkMobile(v, field);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.mobile1 || form.mobile1.length !== 10) { setError("Primary mobile must be 10 digits."); return; }
    if (!form.firstName.trim())  { setError("First name is required."); return; }
    if (!form.lastName.trim())   { setError("Last name is required."); return; }

    setSubmitting(true);
    const res  = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, createdBy: userEmail || "" }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      setSuccess(true);
      setForm(EMPTY_FORM);
      setMob1Status("idle");
      setMob2Status("idle");
      setTimeout(() => setSuccess(false), 4000);
    } else {
      setError(data.error || "Something went wrong.");
    }
  }

  const mob1Hint = {
    idle:     <p className="text-xs text-slate-400 mt-1">Enter 10-digit number — we'll check the database</p>,
    checking: <p className="text-xs text-sky-500 mt-1 flex items-center gap-1"><Spinner size={11} /> Checking database…</p>,
    new:      <p className="text-xs text-emerald-600 mt-1">✓ Number is new — fill the form below</p>,
    exists:   <p className="text-xs text-amber-600 mt-1">⚠ Already registered — details shown above</p>,
  }[mob1Status];

  const mob2Hint = {
    idle:     null,
    checking: <p className="text-xs text-sky-500 mt-1 flex items-center gap-1"><Spinner size={11} /> Checking…</p>,
    new:      <p className="text-xs text-emerald-600 mt-1">✓ Number is available</p>,
    exists:   <p className="text-xs text-amber-600 mt-1">⚠ This number belongs to another customer</p>,
  }[mob2Status];

  return (
    <>
      {showPopup && matchedCustomer && (
        <CustomerPopup
          customer={matchedCustomer}
          isAdmin={isAdmin}
          onClose={() => { setShowPopup(false); setMatchedCustomer(null); }}
          onDeleted={() => {}}
          onUpdated={(updated) => setMatchedCustomer(updated)}
        />
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Mobile Numbers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
            Mobile Numbers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Primary Mobile No." required>
              <div className="relative">
                <input type="tel" inputMode="numeric" maxLength={10}
                  placeholder="10-digit number"
                  value={form.mobile1}
                  onChange={e => handleMobileChange("mobile1", e.target.value)}
                  className={`${inputCls} pr-9 ${mob1Status === "exists" ? "border-amber-300 ring-amber-200" : mob1Status === "new" ? "border-emerald-300" : ""}`}
                />
                {mob1Status === "checking" && <span className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size={15} /></span>}
                {mob1Status === "new"      && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-base">✓</span>}
                {mob1Status === "exists"   && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 text-base">!</span>}
              </div>
              {mob1Hint}
            </Field>

            <Field label="Secondary Mobile No.">
              <div className="relative">
                <input type="tel" inputMode="numeric" maxLength={10}
                  placeholder="10-digit number (optional)"
                  value={form.mobile2}
                  onChange={e => handleMobileChange("mobile2", e.target.value)}
                  className={`${inputCls} pr-9 ${mob2Status === "exists" ? "border-amber-300" : mob2Status === "new" ? "border-emerald-300" : ""}`}
                />
                {mob2Status === "checking" && <span className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size={15} /></span>}
              </div>
              {mob2Hint}
            </Field>
          </div>
        </div>

        {showForm && (
          <>
            {/* Category */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                Category
              </h3>
              <Field label="Category">
                <input type="text" placeholder="e.g. VIP, REGULAR, CORPORATE…"
                  value={form.category} onChange={e => setCap("category", e.target.value)} className={inputCls} />
              </Field>
            </div>

            {/* Name */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Full Name
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="First Name" required>
                  <input type="text" placeholder="FIRST" value={form.firstName}
                    onChange={e => setCap("firstName", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Middle Name">
                  <input type="text" placeholder="MIDDLE" value={form.middleName}
                    onChange={e => setCap("middleName", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Last Name" required>
                  <input type="text" placeholder="LAST" value={form.lastName}
                    onChange={e => setCap("lastName", e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Address Line 1">
                  <input type="text" placeholder="HOUSE / FLAT NO, STREET"
                    value={form.address1} onChange={e => setCap("address1", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Address Line 2">
                  <input type="text" placeholder="LANDMARK, COLONY"
                    value={form.address2} onChange={e => setCap("address2", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Area">
                  <input type="text" placeholder="AREA / LOCALITY"
                    value={form.area} onChange={e => setCap("area", e.target.value)} className={inputCls} />
                </Field>
                <Field label="City">
                  <input type="text" placeholder="CITY"
                    value={form.city} onChange={e => setCap("city", e.target.value)} className={inputCls} />
                </Field>
                <Field label="District">
                  <input type="text" placeholder="DISTRICT"
                    value={form.district} onChange={e => setCap("district", e.target.value)} className={inputCls} />
                </Field>
                <Field label="State">
                  <input type="text" placeholder="STATE"
                    value={form.state} onChange={e => setCap("state", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Pincode">
                  <input type="text" inputMode="numeric" maxLength={6} placeholder="6-DIGIT PINCODE"
                    value={form.pincode}
                    onChange={e => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={inputCls} />
                </Field>
              </div>
            </div>

            {/* Other Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                Other Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Blood Group">
                  <select value={form.bloodGroup} onChange={e => set("bloodGroup", e.target.value)} className={inputCls}>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b || "— Select —"}</option>)}
                  </select>
                </Field>
                <Field label="Religion">
                  <input type="text" placeholder="E.G. HINDU, ISLAM, CHRISTIAN…"
                    value={form.religion} onChange={e => setCap("religion", e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <span>✓</span> Customer saved successfully!
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-sm hover:bg-sky-600 transition disabled:opacity-60 flex items-center gap-2">
              {submitting && <Spinner size={15} />}
              {submitting ? "Saving…" : "Save Customer"}
            </button>
          </>
        )}
      </form>
    </>
  );
}

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = {
  admin:    [{ key: "add", label: "Add Customer" }, { key: "search", label: "All Customers" }, { key: "export", label: "Export" }],
  accounts: [{ key: "add", label: "Add Customer" }, { key: "search", label: "All Customers" }],
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AddCustomerPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState("add");

  const role    = session?.user?.role;
  const isAdmin = role === "admin";

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

  // 404 for unauthenticated users or unknown roles
  if (!session || (role !== "admin" && role !== "accounts")) {
    return <NotFoundPage />;
  }

  const tabs = TABS[role] || TABS.accounts;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Customer Management</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {isAdmin ? "Admin" : "Accounts"} · {session?.user?.name || session?.user?.email}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${isAdmin ? "bg-sky-50 text-sky-600 border-sky-200" : "bg-violet-50 text-violet-600 border-violet-200"}`}>
            {isAdmin ? "Admin" : "Accounts"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition -mb-px ${tab === t.key ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {tab === "add"    && <AddForm isAdmin={isAdmin} userEmail={session?.user?.email} />}
        {tab === "search" && <SearchPanel isAdmin={isAdmin} />}
        {tab === "export" && isAdmin && <ExportBar />}
      </div>
    </div>
  );
}