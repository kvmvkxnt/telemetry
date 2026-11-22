import { NextResponse } from "next/server";
import { getPublicState, setLanguage, setLogoScale, setWinnerMetric } from "@/lib/store";
import { WINNER_METRICS } from "@/lib/winner";

export async function GET() {
  return NextResponse.json(getPublicState());
}

export async function PATCH(req: Request) {
  const body = await req.json();
  try {
    if (body.winnerMetric !== undefined) {
      if (!WINNER_METRICS.includes(body.winnerMetric)) {
        return NextResponse.json(
          { error: `winnerMetric must be one of: ${WINNER_METRICS.join(", ")}` },
          { status: 400 }
        );
      }
      setWinnerMetric(body.winnerMetric);
    }
    if (body.logoScale !== undefined) {
      setLogoScale(Number(body.logoScale));
    }
    if (body.language !== undefined) {
      setLanguage(body.language);
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  return NextResponse.json(getPublicState());
}
