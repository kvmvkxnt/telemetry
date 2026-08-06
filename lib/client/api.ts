"use client";

import type { PublicState, Racer } from "@/lib/store";
import type { DragySession } from "@/lib/dragy";

async function json<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Request failed");
  return body as T;
}

export const api = {
  getState: () => fetch("/api/state", { cache: "no-store" }).then((r) => json<PublicState>(r)),

  createRacer: (name: string, vehicle: string) =>
    fetch("/api/racers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, vehicle }),
    }).then((r) => json<Racer>(r)),

  createRace: (racerAId: number, racerBId: number | null) =>
    fetch("/api/races", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ racerAId, racerBId }),
    }).then((r) => json(r)),

  startRace: (raceId: number) => fetch(`/api/races/${raceId}/start`, { method: "POST" }).then((r) => json(r)),

  submitResults: (
    raceId: number,
    results: Array<{
      racerId: number;
      distance: number | null;
      elapsedTime: number | null;
      topSpeed: number | null;
      zeroToHundredTime: number | null;
      hundredToTwoHundredTime: number | null;
      source?: "manual" | "dragy";
      rawDragyPayload?: unknown;
    }>
  ) =>
    fetch(`/api/races/${raceId}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    }).then((r) => json(r)),

  pullDragy: (deviceId: string) =>
    fetch(`/api/dragy?deviceId=${encodeURIComponent(deviceId)}`).then((r) =>
      json<{ session: DragySession | null }>(r)
    ),

  setWinnerMetric: (winnerMetric: "elapsed_time" | "top_speed") =>
    fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerMetric }),
    }).then((r) => json<PublicState>(r)),
};
