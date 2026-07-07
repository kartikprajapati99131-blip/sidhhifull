"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AVATAR_COLORS = [
  { bg: "#E6F1FB", text: "#185FA5", border: "#B5D4F4" },
  { bg: "#E1F5EE", text: "#0F6E56", border: "#9FE1CB" },
  { bg: "#FBEAF0", text: "#993556", border: "#F4C0D1" },
  { bg: "#FAEEDA", text: "#854F0B", border: "#FAC775" },
  { bg: "#EEEDFE", text: "#534AB7", border: "#CECBF6" },
  { bg: "#FAECE7", text: "#993C1D", border: "#F5C4B3" },
];

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function firstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function SalaryOverview() {
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(todayStr());
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);
  const router = useRouter();

  const load = () => {
    setLoading(true);
    fetch(`/api/salary/summary?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((res) => setData(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entries = data.filter((e) => (e.name || "").toLowerCase().includes(search.toLowerCase()));
  const grandTotal = entries.reduce((s, e) => s + e.totalIncome, 0);

  const exportPdf = async (type) => {
    setExporting(type);
    try {
      const res = await fetch(`/api/salary/export/${type}?from=${from}&to=${to}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-salary-${from}-to-${to}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Salary Details</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage bank details, expenses and salary</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
        </div>
        <button onClick={load} className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
          Apply
        </button>
        <div className="flex-1" />
        <button onClick={() => exportPdf("bank")} disabled={exporting === "bank"}
          className="text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60">
          {exporting === "bank" ? "Exporting..." : "Export Bank PDF"}
        </button>
        <button onClick={() => exportPdf("personal")} disabled={exporting === "personal"}
          className="text-sm font-medium text-white bg-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60">
          {exporting === "personal" ? "Exporting..." : "Export Personal PDF"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total employees</p>
          <p className="text-xl font-semibold text-gray-900">{entries.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total payable</p>
          <p className="text-xl font-semibold text-gray-900">Rs. {grandTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-5 shadow-sm">
        <input type="text" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400" />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {entries.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400 text-sm">No employees found.</div>
          ) : (
            entries.map((emp, i) => {
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div key={emp.userId} onClick={() => router.push(`/salary/${emp.userId}?from=${from}&to=${to}`)}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-gray-300 transition-all shadow-sm cursor-pointer">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 border"
                    style={{ background: color.bg, color: color.text, borderColor: color.border }}>
                    {getInitials(emp.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-400">{emp.totalHours.toFixed(1)} hrs · Rs. {emp.hourlyRate.toFixed(2)}/hr</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">Rs. {emp.totalIncome.toFixed(2)}</p>
                    {emp.adjustments !== 0 && (
                      <p className={`text-xs ${emp.adjustments > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {emp.adjustments > 0 ? "+" : ""}{emp.adjustments.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}