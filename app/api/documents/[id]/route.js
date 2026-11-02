import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PdfDocument from "@/models/PdfDocument";
import PdfChunk from "@/models/PdfChunk";
import { getPdfManagerSession } from "@/lib/pdfAuth";
import { isObjectId, toPublic } from "@/lib/pdfServer";
import { MAX_DESCRIPTION, MAX_TITLE } from "@/lib/pdfConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ success: false, message: "Not authorised" }, { status: 403 });
const notFound = () => NextResponse.json({ success: false, message: "Document not found" }, { status: 404 });

// PATCH -> edit title / description / published
export async function PATCH(request, { params }) {
  try {
    if (!(await getPdfManagerSession())) return deny();
    const { id } = await params;
    if (!isObjectId(id)) return notFound();

    const body = await request.json().catch(() => ({}));
    const patch = {};

    if (body.title !== undefined) {
      const t = String(body.title).trim();
      if (!t || t.length > MAX_TITLE)
        return NextResponse.json({ success: false, message: `Title is required (max ${MAX_TITLE} characters)` }, { status: 400 });
      patch.title = t;
    }
    if (body.description !== undefined) {
      const d = String(body.description).trim();
      if (d.length > MAX_DESCRIPTION)
        return NextResponse.json({ success: false, message: `Description is too long (max ${MAX_DESCRIPTION} characters)` }, { status: 400 });
      patch.description = d;
    }
    if (body.published !== undefined) patch.published = Boolean(body.published);

    await dbConnect();
    const doc = await PdfDocument.findOneAndUpdate({ _id: id, status: "ready" }, { $set: patch }, { new: true }).lean();
    if (!doc) return notFound();
    return NextResponse.json({ success: true, data: toPublic(doc) });
  } catch (error) {
    console.error("PATCH /api/documents/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to update document" }, { status: 500 });
  }
}

// DELETE -> remove record and all stored chunks (also used to cancel an upload)
export async function DELETE(request, { params }) {
  try {
    if (!(await getPdfManagerSession())) return deny();
    const { id } = await params;
    if (!isObjectId(id)) return notFound();

    await dbConnect();
    const doc = await PdfDocument.findByIdAndDelete(id).lean();
    if (!doc) return notFound();
    await PdfChunk.deleteMany({ docId: doc._id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete document" }, { status: 500 });
  }
}
