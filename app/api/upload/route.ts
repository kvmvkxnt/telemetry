import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { uploadDir } from "@/lib/uploads";

const MAX_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    return NextResponse.json({ error: "unsupported image type" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (max 5MB)" }, { status: 400 });
  }

  fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `${crypto.randomUUID()}${ext}`;
  // turbopackIgnore: the path is already scoped to data/uploads; without this
  // the bundler traces the whole project into the server output.
  fs.writeFileSync(path.join(/*turbopackIgnore: true*/ uploadDir, filename), buf);
  return NextResponse.json({ url: `/api/logo/${filename}` });
}
