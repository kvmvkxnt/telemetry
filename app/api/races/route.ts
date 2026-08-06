import { NextResponse } from "next/server";
import { createRace, listRaces } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listRaces());
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const race = createRace(body.racerAId, body.racerBId ?? null);
    return NextResponse.json(race, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
