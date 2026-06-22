import DuePaymentManager from "@/components/DuePaymentManager";
import DueReminderPopup from "@/components/DueReminderPopup";
import TodayUpdatedEntries from "@/components/TodayUpdatedEntries";

export const metadata = {
  title: "Due Payments | Admin",
};

export default function DuePaymentsPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Payment Due Reminders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track upcoming dues, call customers, and reschedule follow ups.
          </p>
        </div>

        {/* Add Due Payment form + Pending Due Payments table */}
        <DuePaymentManager />

        {/* Today's Updated Follow Ups */}
        <TodayUpdatedEntries />
      </div>

      {/* Auto-shows on page load if there are overdue/today's pending payments */}
      <DueReminderPopup />
    </div>
  );
}