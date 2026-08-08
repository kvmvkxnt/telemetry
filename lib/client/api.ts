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

  createRacer: (brand: string, model: string, logoUrl: string | null) =>
    fetch("/api/racers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, model, logoUrl }),
    }).then((r) => json<Racer>(r)),

  createRace: (racerAId: number, racerBId: number | null) =>
    fetch("/api/races", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ racerAId, racerBId }),
    }).then((r) => json(r)),

  uploadLogo: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    return json<{ url: string }>(res);
  },

  /** Lines a race up ("on the line"). */
  stageRace: (raceId: number) => fetch(`/api/races/${raceId}/stage`, { method: "POST" }).then((r) => json(r)),

  /** Launches a staged race ("lights out — go"). */
  launchRace: (raceId: number) => fetch(`/api/races/${raceId}/start`, { method: "POST" }).then((r) => json(r)),

  /** Run is over, waiting on timing from the track. */
  finishRun: (raceId: number) => fetch(`/api/races/${raceId}/finish`, { method: "POST" }).then((r) => json(r)),

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

  setLanguage: (language: string) =>
    fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    }).then((r) => json<PublicState>(r)),

  setLogoScale: (logoScale: number) =>
    fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoScale }),
    }).then((r) => json<PublicState>(r)),

  deleteRace: (raceId: number) =>
    fetch(`/api/races/${raceId}`, { method: "DELETE" }).then((r) => json(r)),

  /** Wipes a race's results and returns it to the running order. */
  clearRaceResults: (raceId: number) =>
    fetch(`/api/races/${raceId}/result`, { method: "DELETE" }).then((r) => json(r)),

  deleteRacer: (racerId: number) =>
    fetch(`/api/racers/${racerId}`, { method: "DELETE" }).then((r) => json(r)),

  reset: (scope: "results" | "races" | "all") =>
    fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
    }).then((r) => json(r)),
};
