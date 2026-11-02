import { redirect } from "next/navigation";
import { getPdfManagerSession } from "@/lib/pdfAuth";
import DocumentManager from "@/components/documents/DocumentManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage documents",
  robots: { index: false, follow: false },
};

export default async function ManageDocumentsPage() {
  const session = await getPdfManagerSession();
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen bg-slate-50">
      <DocumentManager />
    </main>
  );
}
