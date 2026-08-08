import type { PublicRace } from "./store";

/**
 * Identifies a race's *results*, not the race itself. The display uses this to
 * decide when to play the winner reveal: a re-run after a clear, or a
 * corrected result being re-published, must play it again — keying on race id
 * alone silently swallows every showing after the first.
 */
export function resultSignature(race: PublicRace): string {
  return race.results
    .map((r) => `${r.racer_id}:${r.elapsed_time}:${r.top_speed}:${r.created_at}`)
    .sort()
    .join("|");
}

/** Returns the race whose results changed since `seen`, if any. */
export function findRevealTarget(
  leaderboard: PublicRace[],
  seen: Map<number, string>
): PublicRace | null {
  return leaderboard.find((r) => seen.get(r.id) !== resultSignature(r)) ?? null;
}
