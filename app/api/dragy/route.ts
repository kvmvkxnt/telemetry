import { NextResponse } from "next/server";
import { dragyProvider } from "@/lib/dragy";

// Falls back to null (never throws) so the admin form can silently drop to
// manual entry if Dragy is unreachable or not configured for this device.
export async function GET(req: Request) {
  const deviceId = new URL(req.url).searchParams.get("deviceId") ?? "unknown";
  try {
    const session = await dragyProvider.getLatestSession(deviceId);
    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ session: null });
  }
}
