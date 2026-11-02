import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PdfDocument from "@/models/PdfDocument";
import { getPdfManagerSession } from "@/lib/pdfAuth";
import { isObjectId, parseRange, streamBytes } from "@/lib/pdfServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// /api/documents/<id>/file             -> inline (preview)
// /api/documents/<id>/file?download=1  -> forces a download
// Supports HTTP Range so big PDFs open fast in the browser viewer.
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await dbConnect();
    const doc = await PdfDocument.findById(id).lean();
    if (!doc || doc.status !== "ready")
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    // Hidden (draft) files are visible to managers only
    if (!doc.published && !(await getPdfManagerSession()))
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    const download = new URL(request.url).searchParams.get("download") === "1";
    const range = parseRange(request.headers.get("range"), doc.size);

    if (range === "invalid") {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${doc.size}` },
      });
    }

    const start = range ? range.start : 0;
    const end = range ? range.end : doc.size - 1;

    // Count a download once (the request that starts at byte 0)
    if (download && start === 0) {
      PdfDocument.updateOne({ _id: doc._id }, { $inc: { downloads: 1 } }).catch(() => {});
    }

    const base = (doc.title || "document").replace(/[\\/:*?"<>|\r\n]+/g, " ").trim().slice(0, 100) || "document";
    const asciiName = base.replace(/[^\x20-\x7E]+/g, "").replace(/\s+/g, "-").replace(/^-+|-+$/g, "") || "document";
    const disposition = `${download ? "attachment" : "inline"}; filename="${asciiName}.pdf"; filename*=UTF-8''${encodeURIComponent(base)}.pdf`;

    return new Response(streamBytes(doc._id, doc.chunkSize, start, end), {
      status: range ? 206 : 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes",
        ...(range ? { "Content-Range": `bytes ${start}-${end}/${doc.size}` } : {}),
        "Content-Disposition": disposition,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("GET /api/documents/[id]/file error:", error);
    return NextResponse.json({ message: "Could not load file" }, { status: 500 });
  }
}
