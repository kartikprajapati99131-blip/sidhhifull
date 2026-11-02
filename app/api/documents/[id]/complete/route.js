import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PdfDocument from "@/models/PdfDocument";
import PdfChunk from "@/models/PdfChunk";
import { getPdfManagerSession } from "@/lib/pdfAuth";
import { isObjectId, toPublic } from "@/lib/pdfServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (message, status) => NextResponse.json({ success: false, message }, { status });

// POST /api/documents/<id>/complete -> verify every piece arrived, then go live
export async function POST(request, { params }) {
  try {
    if (!(await getPdfManagerSession())) return fail("Not authorised", 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail("Document not found", 404);

    await dbConnect();
    const doc = await PdfDocument.findById(id);
    if (!doc) return fail("Document not found", 404);
    if (doc.status === "ready") return NextResponse.json({ success: true, data: toPublic(doc) });

    const stored = await PdfChunk.countDocuments({ docId: doc._id });
    if (stored !== doc.chunkCount)
      return fail(`Upload incomplete (${stored} of ${doc.chunkCount} parts received). Please try again.`, 409);

    doc.status = "ready";
    await doc.save();
    return NextResponse.json({ success: true, data: toPublic(doc) });
  } catch (error) {
    console.error("POST /api/documents/[id]/complete error:", error);
    return fail("Could not finish upload", 500);
  }
}
