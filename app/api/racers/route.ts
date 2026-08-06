import { NextResponse } from "next/server";
import { createRacer, listRacers } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listRacers());
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const racer = createRacer(body.name, body.vehicle ?? null, body.photoUrl ?? null);
    return NextResponse.json(racer, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
