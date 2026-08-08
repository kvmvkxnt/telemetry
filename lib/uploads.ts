import path from "node:path";

// Uploads live OUTSIDE public/ on purpose: Next snapshots the public file
// list at build time, so anything written there at runtime 404s forever.
// They are served by app/api/logo/[file]/route.ts instead.
export const uploadDir = path.join(process.cwd(), "data", "uploads");

/** Filenames we generate: uuid + known extension. Anything else is rejected. */
export const SAFE_NAME = /^[a-f0-9-]{36}\.(jpg|png|webp|gif|svg)$/;

export const CONTENT_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};
