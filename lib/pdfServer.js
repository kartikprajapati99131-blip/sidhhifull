import mongoose from "mongoose";
import PdfDocument from "@/models/PdfDocument";
import PdfChunk from "@/models/PdfChunk";

export const isObjectId = (id) => mongoose.isValidObjectId(id) && String(id).length === 24;

// Remove unfinished uploads older than 6 hours (browser closed mid-upload etc.)
export async function cleanupStaleUploads() {
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const stale = await PdfDocument.find({ status: "uploading", createdAt: { $lt: cutoff } })
    .select("_id")
    .lean();
  if (!stale.length) return;
  const ids = stale.map((d) => d._id);
  await PdfChunk.deleteMany({ docId: { $in: ids } });
  await PdfDocument.deleteMany({ _id: { $in: ids } });
}

// Public shape sent to browsers (never exposes internals)
export function toPublic(doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description || "",
    fileName: doc.fileName,
    size: doc.size,
    published: doc.published,
    downloads: doc.downloads || 0,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function listDocuments({ includeDrafts = false, q = "" } = {}) {
  const query = { status: "ready" };
  if (!includeDrafts) query.published = true;
  const s = q.trim();
  if (s) {
    const rx = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: rx }, { description: rx }];
  }
  const docs = await PdfDocument.find(query).sort({ createdAt: -1 }).limit(500).lean();
  return docs.map(toPublic);
}

// Mongo may hand back a Buffer or a BSON Binary depending on driver settings
export function toBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (data?.buffer) return Buffer.from(data.buffer);
  return Buffer.from(data);
}

// Parse "Range: bytes=a-b". Returns null (no/ignored range), "invalid", or {start,end}
export function parseRange(header, size) {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null;
  const [, s, e] = m;
  if (s === "" && e === "") return null;
  let start;
  let end;
  if (s === "") {
    const n = parseInt(e, 10);
    if (!n) return "invalid";
    start = Math.max(size - n, 0);
    end = size - 1;
  } else {
    start = parseInt(s, 10);
    end = e === "" ? size - 1 : Math.min(parseInt(e, 10), size - 1);
  }
  if (start >= size || start > end) return "invalid";
  return { start, end };
}

// Stream bytes [start..end] by reading one small chunk at a time (low memory)
export function streamBytes(docId, chunkSize, start, end) {
  const first = Math.floor(start / chunkSize);
  const last = Math.floor(end / chunkSize);
  let idx = first;
  return new ReadableStream({
    async pull(controller) {
      try {
        if (idx > last) return controller.close();
        const c = await PdfChunk.findOne({ docId, index: idx }).select("data").exec();
        if (!c) return controller.error(new Error(`Missing chunk ${idx}`));
        const buf = toBuffer(c.data);
        const from = idx === first ? start - idx * chunkSize : 0;
        const to = idx === last ? end - idx * chunkSize + 1 : buf.length;
        controller.enqueue(new Uint8Array(buf.subarray(from, to)));
        idx++;
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      idx = last + 1;
    },
  });
}
