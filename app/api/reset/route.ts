import { NextResponse } from "next/server";
import { resetEvent, type ResetScope } from "@/lib/store";

const SCOPES: ResetScope[] = ["results", "races", "all"];

export async function POST(req: Request) {
  const body = await req.json();
  if (!SCOPES.includes(body.scope)) {
    return NextResponse.json({ error: `scope must be one of ${SCOPES.join(", ")}` }, { status: 400 });
  }
  resetEvent(body.scope);
  return NextResponse.json({ ok: true });
}
