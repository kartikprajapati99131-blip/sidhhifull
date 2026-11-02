import dbConnect from "@/lib/dbConnect";
import { listDocuments } from "@/lib/pdfServer";
import DocumentLibrary from "@/components/documents/DocumentLibrary";

export const dynamic = "force-dynamic"; // always show the newest uploads

export const metadata = {
  title: "Documents",
  description: "Preview and download catalogues, price lists and other documents from SIDDHI.",
};

export default async function DocumentsPage() {
  let docs = [];
  let failed = false;
  try {
    await dbConnect();
    docs = await listDocuments();
  } catch (err) {
    console.error("Documents page error:", err);
    failed = true;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Documents</h1>
          <p className="mt-2 max-w-xl text-slate-600">
            Preview any file right here, or download a copy to keep.
          </p>
        </header>

        {failed ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            We could not load the documents right now. Please refresh the page in a moment.
          </p>
        ) : (
          <DocumentLibrary docs={docs} />
        )}
      </div>
    </main>
  );
}
