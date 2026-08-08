import { NextResponse } from "next/server";
import { stageRace } from "@/lib/store";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  stageRace(Number(id));
  return NextResponse.json({ ok: true });
}
