import mongoose from "mongoose";

const PdfDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    fileName: { type: String, default: "document.pdf" },
    size: { type: Number, required: true }, // bytes
    chunkSize: { type: Number, required: true },
    chunkCount: { type: Number, required: true },
    // "uploading" while chunks are arriving, "ready" once verified
    status: { type: String, enum: ["uploading", "ready"], default: "uploading", index: true },
    published: { type: Boolean, default: true, index: true },
    downloads: { type: Number, default: 0 },
    uploadedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.PdfDocument ||
  mongoose.model("PdfDocument", PdfDocumentSchema);
