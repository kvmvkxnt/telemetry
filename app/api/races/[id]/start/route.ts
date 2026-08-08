import { NextResponse } from "next/server";
import { launchRace } from "@/lib/store";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  launchRace(Number(id));
  return NextResponse.json({ ok: true });
}
