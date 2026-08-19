import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust to your actual authOptions path
import PolicyManager from "@/components/policies/PolicyManager";

export const metadata = {
  title: "Policies | Company Handbook",
  description: "Browse, manage, and export company policies by category.",
};

export default async function PoliciesPage() {
  const session = await getServerSession(authOptions);

  // if (!session || !["admin", "subadmin"].includes(session.user?.role)) {
  //   redirect("/"); // or redirect("/login"), or a 403 page — your call
  // }

  return (
    <main className="min-h-screen bg-slate-50">
      <PolicyManager />
    </main>
  );
}