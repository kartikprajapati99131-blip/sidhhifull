export const AVATAR_COLORS = [
  { bg: "#E6F1FB", text: "#185FA5", border: "#B5D4F4" },
  { bg: "#E1F5EE", text: "#0F6E56", border: "#9FE1CB" },
  { bg: "#FBEAF0", text: "#993556", border: "#F4C0D1" },
  { bg: "#FAEEDA", text: "#854F0B", border: "#FAC775" },
  { bg: "#EEEDFE", text: "#534AB7", border: "#CECBF6" },
  { bg: "#FAECE7", text: "#993C1D", border: "#F5C4B3" },
];

export function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function firstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function formatHM(hours = 0, minutes = 0) {
  return `+${hours}h ${minutes}m`;
}

export function formatDateLabel(dateStr) {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  return new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}
