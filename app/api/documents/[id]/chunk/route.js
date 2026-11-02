import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PdfDocument from "@/models/PdfDocument";
import PdfChunk from "@/models/PdfChunk";
import { getPdfManagerSession } from "@/lib/pdfAuth";
import { isObjectId } from "@/lib/pdfServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fail = (message, status) => NextResponse.json({ success: false, message }, { status });

// PUT /api/documents/<id>/chunk?index=0   body = raw bytes of that piece
export async function PUT(request, { params }) {
  try {
    if (!(await getPdfManagerSession())) return fail("Not authorised", 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail("Document not found", 404);

    const index = Number(new URL(request.url).searchParams.get("index"));
    if (!Number.isInteger(index) || index < 0) return fail("Invalid chunk index", 400);

    await dbConnect();
    const doc = await PdfDocument.findById(id).lean();
    if (!doc) return fail("Document not found", 404);
    if (doc.status !== "uploading") return fail("This upload is already finished", 409);
    if (index >= doc.chunkCount) return fail("Chunk index out of range", 400);

    const data = Buffer.from(await request.arrayBuffer());
    const expected =
      index === doc.chunkCount - 1 ? doc.size - index * doc.chunkSize : doc.chunkSize;
    if (data.length !== expected) return fail("Chunk has the wrong size. Please retry.", 400);

    // The very first bytes of a real PDF are "%PDF-"
    if (index === 0 && data.subarray(0, 5).toString("latin1") !== "%PDF-")
      return fail("This file is not a valid PDF", 415);

    // upsert: safe if the browser retries the same chunk
    await PdfChunk.updateOne({ docId: doc._id, index }, { $set: { data } }, { upsert: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/documents/[id]/chunk error:", error);
    return fail("Chunk upload failed", 500);
  }
}
