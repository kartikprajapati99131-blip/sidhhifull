import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PdfDocument from "@/models/PdfDocument";
import { getPdfManagerSession } from "@/lib/pdfAuth";
import { cleanupStaleUploads, listDocuments, toPublic } from "@/lib/pdfServer";
import { CHUNK_SIZE, MAX_DESCRIPTION, MAX_PDF_BYTES, MAX_TITLE } from "@/lib/pdfConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/documents?q=term            -> public: published PDFs only
// GET /api/documents?scope=admin       -> admin: includes drafts
export async function GET(request) {
  try {
    await dbConnect();
    const params = new URL(request.url).searchParams;
    const q = params.get("q") || "";

    if (params.get("scope") === "admin") {
      const session = await getPdfManagerSession();
      if (!session) {
        return NextResponse.json({ success: false, message: "Not authorised" }, { status: 403 });
      }
      await cleanupStaleUploads();
      return NextResponse.json({ success: true, data: await listDocuments({ includeDrafts: true, q }) });
    }

    return NextResponse.json({ success: true, data: await listDocuments({ q }) });
  } catch (error) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ success: false, message: "Failed to load documents" }, { status: 500 });
  }
}

// POST /api/documents  -> step 1 of upload: create the record, get an id back
export async function POST(request) {
  try {
    const session = await getPdfManagerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Not authorised" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const size = Number(body.size);
    const fileName = String(body.fileName || "document.pdf").slice(0, 200);

    if (!title || title.length > MAX_TITLE)
      return NextResponse.json({ success: false, message: `Title is required (max ${MAX_TITLE} characters)` }, { status: 400 });
    if (description.length > MAX_DESCRIPTION)
      return NextResponse.json({ success: false, message: `Description is too long (max ${MAX_DESCRIPTION} characters)` }, { status: 400 });
    if (!Number.isInteger(size) || size <= 0)
      return NextResponse.json({ success: false, message: "Invalid file size" }, { status: 400 });
    if (size > MAX_PDF_BYTES)
      return NextResponse.json({ success: false, message: `File is larger than ${MAX_PDF_BYTES / 1024 / 1024} MB` }, { status: 413 });

    await dbConnect();
    const doc = await PdfDocument.create({
      title,
      description,
      fileName,
      size,
      chunkSize: CHUNK_SIZE,
      chunkCount: Math.ceil(size / CHUNK_SIZE),
      published: body.published !== false,
      uploadedBy: session.user?.name || session.user?.email || "admin",
    });

    return NextResponse.json(
      { success: true, data: { id: String(doc._id), chunkSize: doc.chunkSize, chunkCount: doc.chunkCount } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ success: false, message: "Could not start upload" }, { status: 500 });
  }
}
