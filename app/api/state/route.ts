import { NextResponse } from "next/server";
import { getPublicState, setLogoScale, setWinnerMetric } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getPublicState());
}

export async function PATCH(req: Request) {
  const body = await req.json();
  try {
    if (body.winnerMetric !== undefined) {
      if (body.winnerMetric !== "elapsed_time" && body.winnerMetric !== "top_speed") {
        return NextResponse.json(
          { error: "winnerMetric must be elapsed_time or top_speed" },
          { status: 400 }
        );
      }
      setWinnerMetric(body.winnerMetric);
    }
    if (body.logoScale !== undefined) {
      setLogoScale(Number(body.logoScale));
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  return NextResponse.json(getPublicState());
}
