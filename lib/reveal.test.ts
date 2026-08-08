import { describe, expect, it } from "vitest";
import { findRevealTarget, resultSignature } from "./reveal";
import type { PublicRace } from "./store";

function race(id: number, elapsed: number, createdAt = "2026-08-08 10:00:00"): PublicRace {
  return {
    id,
    event_id: 1,
    racer_a_id: 1,
    racer_b_id: null,
    status: "completed",
    created_at: createdAt,
    racerA: { id: 1, event_id: 1, brand: "Toyota", model: "Supra", logo_url: null },
    racerB: null,
    winnerRacerId: 1,
    results: [
      {
        id: 1,
        race_id: id,
        racer_id: 1,
        distance: 402,
        elapsed_time: elapsed,
        top_speed: 220,
        zero_to_100_time: null,
        hundred_to_200_time: null,
        source: "manual",
        raw_dragy_payload: null,
        created_at: createdAt,
      },
    ],
  };
}

describe("reveal trigger", () => {
  it("fires for a race that was not on the board", () => {
    const seen = new Map<number, string>();
    expect(findRevealTarget([race(1, 11.2)], seen)?.id).toBe(1);
  });

  it("does not fire again for an unchanged result", () => {
    const r = race(1, 11.2);
    const seen = new Map([[1, resultSignature(r)]]);
    expect(findRevealTarget([r], seen)).toBeNull();
  });

  it("fires again when a result is corrected and re-published", () => {
    const original = race(1, 11.2, "2026-08-08 10:00:00");
    const seen = new Map([[1, resultSignature(original)]]);

    const corrected = race(1, 10.9, "2026-08-08 10:05:00");
    expect(findRevealTarget([corrected], seen)?.id).toBe(1);
  });

  it("fires again when a cleared race is re-run", () => {
    const first = race(1, 11.2, "2026-08-08 10:00:00");
    const seen = new Map([[1, resultSignature(first)]]);

    // Cleared: the race leaves the leaderboard, so its entry is forgotten.
    seen.delete(1);

    const rerun = race(1, 11.4, "2026-08-08 10:30:00");
    expect(findRevealTarget([rerun], seen)?.id).toBe(1);
  });
});
