import { NextResponse } from "next/server";
import { submitResults, type ResultInput } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const results = body.results as ResultInput[];
  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ error: "results array is required" }, { status: 400 });
  }
  try {
    submitResults(Number(id), results);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
