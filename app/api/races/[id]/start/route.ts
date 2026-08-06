import { NextResponse } from "next/server";
import { startRace } from "@/lib/store";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  startRace(Number(id));
  return NextResponse.json({ ok: true });
}
