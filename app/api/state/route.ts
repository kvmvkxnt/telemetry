import { NextResponse } from "next/server";
import { getPublicState, setWinnerMetric } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getPublicState());
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (body.winnerMetric !== "elapsed_time" && body.winnerMetric !== "top_speed") {
    return NextResponse.json({ error: "winnerMetric must be elapsed_time or top_speed" }, { status: 400 });
  }
  setWinnerMetric(body.winnerMetric);
  return NextResponse.json(getPublicState());
}
