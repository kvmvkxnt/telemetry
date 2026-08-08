import fs from "node:fs";
import path from "node:path";
import { CONTENT_TYPE, SAFE_NAME, uploadDir } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;

  // Only serve names we generated ourselves — blocks traversal and anything
  // that isn't one of our own uploads.
  if (!SAFE_NAME.test(file)) return new Response("Not found", { status: 404 });

  const full = path.join(/*turbopackIgnore: true*/ uploadDir, file);
  if (!fs.existsSync(full)) return new Response("Not found", { status: 404 });

  return new Response(fs.readFileSync(full), {
    headers: {
      "Content-Type": CONTENT_TYPE[path.extname(file)] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
