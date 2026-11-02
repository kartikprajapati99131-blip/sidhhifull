import mongoose from "mongoose";

// A PDF is stored as numbered small pieces (well under MongoDB's 16 MB limit).
const PdfChunkSchema = new mongoose.Schema({
  docId: { type: mongoose.Schema.Types.ObjectId, required: true },
  index: { type: Number, required: true },
  data: { type: Buffer, required: true },
});

PdfChunkSchema.index({ docId: 1, index: 1 }, { unique: true });

export default mongoose.models.PdfChunk || mongoose.model("PdfChunk", PdfChunkSchema);
