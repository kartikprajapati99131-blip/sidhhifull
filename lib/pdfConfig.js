// Shared settings for the PDF documents feature (used by server AND browser).
export const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB hard limit
// Each upload request carries < 1 MB, so it passes nginx's default 1 MB body limit
// and Vercel's 4.5 MB limit. 50 MB = about 57 small requests, sent one after another.
export const CHUNK_SIZE = 900 * 1024;
export const MAX_TITLE = 120;
export const MAX_DESCRIPTION = 1000;
