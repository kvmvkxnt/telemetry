import { NextResponse } from "next/server";
import { finishRun } from "@/lib/store";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  finishRun(Number(id));
  return NextResponse.json({ ok: true });
}
