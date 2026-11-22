import db from "./db";
import { determineWinner, type WinnerMetric } from "./winner";
import { isLang, type Lang } from "./i18n";
import { publish } from "./bus";

export type Racer = {
  id: number;
  event_id: number;
  brand: string;
  model: string;
  logo_url: string | null;
};

export type RaceStatus =
  | "pending"
  | "staging"
  | "racing"
  | "awaiting_results"
  | "completed";

export type Race = {
  id: number;
  event_id: number;
  racer_a_id: number;
  racer_b_id: number | null;
  status: RaceStatus;
  created_at: string;
};

export type Result = {
  id: number;
  race_id: number;
  racer_id: number;
  distance: number | null;
  elapsed_time: number | null;
  zero_to_60_time: number | null;
  zero_to_100_time: number | null;
  hundred_to_200_time: number | null;
  source: "manual" | "dragy";
  raw_dragy_payload: string | null;
  created_at: string;
};

export type EventRow = {
  id: number;
  name: string;
  date: string;
  winner_metric: WinnerMetric;
  logo_scale: number;
  language: Lang;
};

// Single-event-per-instance app (see README topology). Event row 1 always exists.
export function getOrCreateEvent(): EventRow {
  const existing = db.prepare("SELECT * FROM events WHERE id = 1").get();
  if (existing) return existing as EventRow;
  db.prepare(
    "INSERT INTO events (id, name, date, winner_metric) VALUES (1, ?, ?, 'elapsed_time')"
  ).run("Drag Race Event", new Date().toISOString().slice(0, 10));
  return db.prepare("SELECT * FROM events WHERE id = 1").get() as EventRow;
}

export function setWinnerMetric(metric: WinnerMetric) {
  getOrCreateEvent();
  db.prepare("UPDATE events SET winner_metric = ? WHERE id = 1").run(metric);
  publish();
}

export function setLanguage(lang: string) {
  if (!isLang(lang)) throw new Error("unsupported language");
  getOrCreateEvent();
  db.prepare("UPDATE events SET language = ? WHERE id = 1").run(lang);
  publish();
}

export const LOGO_SCALE_MIN = 0.5;
export const LOGO_SCALE_MAX = 3;

export function setLogoScale(scale: number) {
  if (!Number.isFinite(scale) || scale < LOGO_SCALE_MIN || scale > LOGO_SCALE_MAX) {
    throw new Error(`logo scale must be between ${LOGO_SCALE_MIN} and ${LOGO_SCALE_MAX}`);
  }
  getOrCreateEvent();
  db.prepare("UPDATE events SET logo_scale = ? WHERE id = 1").run(scale);
  publish();
}

export function listRacers(): Racer[] {
  const event = getOrCreateEvent();
  return db.prepare("SELECT * FROM racers WHERE event_id = ? ORDER BY id").all(event.id) as Racer[];
}

export function createRacer(brand: string, model: string, logoUrl: string | null): Racer {
  if (!brand.trim()) throw new Error("Brand is required");
  if (!model.trim()) throw new Error("Model is required");
  const event = getOrCreateEvent();
  const info = db
    .prepare("INSERT INTO racers (event_id, brand, model, logo_url) VALUES (?, ?, ?, ?)")
    .run(event.id, brand.trim(), model.trim(), logoUrl);
  publish();
  return db.prepare("SELECT * FROM racers WHERE id = ?").get(info.lastInsertRowid) as Racer;
}

export function listRaces(): Race[] {
  const event = getOrCreateEvent();
  return db
    .prepare("SELECT * FROM races WHERE event_id = ? ORDER BY id")
    .all(event.id) as Race[];
}

export function createRace(racerAId: number, racerBId: number | null): Race {
  const event = getOrCreateEvent();
  if (racerAId === racerBId) throw new Error("A racer cannot race itself");
  const info = db
    .prepare(
      "INSERT INTO races (event_id, racer_a_id, racer_b_id, status) VALUES (?, ?, ?, 'pending')"
    )
    .run(event.id, racerAId, racerBId);
  publish();
  return db.prepare("SELECT * FROM races WHERE id = ?").get(info.lastInsertRowid) as Race;
}

/** Lines a race up ("on the line"). Only one race is staging/racing at a time. */
export function stageRace(raceId: number) {
  const tx = db.transaction((id: number) => {
    db.prepare(
      "UPDATE races SET status = 'pending' WHERE status IN ('staging', 'racing') AND id != ?"
    ).run(id);
    db.prepare("UPDATE races SET status = 'staging' WHERE id = ?").run(id);
  });
  tx(raceId);
  publish();
}

/** Launches a staged race ("lights out"). */
export function launchRace(raceId: number) {
  db.prepare("UPDATE races SET status = 'racing' WHERE id = ? AND status = 'staging'").run(raceId);
  publish();
}

/** Run is over, timing not yet relayed. Holds the display on a waiting state
 *  instead of dropping straight back to the leaderboard. */
export function finishRun(raceId: number) {
  db.prepare(
    "UPDATE races SET status = 'awaiting_results' WHERE id = ? AND status = 'racing'"
  ).run(raceId);
  publish();
}

export type ResultInput = {
  racerId: number;
  distance: number | null;
  elapsedTime: number | null;
  zeroToSixtyTime?: number | null;
  zeroToHundredTime: number | null;
  hundredToTwoHundredTime: number | null;
  source?: "manual" | "dragy";
  rawDragyPayload?: unknown;
};

function validateResult(r: ResultInput) {
  const fields: [string, number | null][] = [
    ["distance", r.distance],
    ["elapsed_time", r.elapsedTime],
    ["zero_to_60_time", r.zeroToSixtyTime ?? null],
    ["zero_to_100_time", r.zeroToHundredTime],
    ["hundred_to_200_time", r.hundredToTwoHundredTime],
  ];
  for (const [name, value] of fields) {
    if (value != null && (Number.isNaN(value) || value < 0)) {
      throw new Error(`${name} must be a non-negative number`);
    }
  }
}

/** Upserts a race's results (overwrite-safe) and marks it completed. */
export function submitResults(raceId: number, results: ResultInput[]) {
  for (const r of results) validateResult(r);

  const tx = db.transaction(() => {
    for (const r of results) {
      db.prepare(
        `INSERT INTO results
          (race_id, racer_id, distance, elapsed_time, zero_to_60_time, zero_to_100_time, hundred_to_200_time, source, raw_dragy_payload)
         VALUES (@raceId, @racerId, @distance, @elapsedTime, @zeroToSixtyTime, @zeroToHundredTime, @hundredToTwoHundredTime, @source, @rawDragyPayload)
         ON CONFLICT(race_id, racer_id) DO UPDATE SET
           distance = excluded.distance,
           elapsed_time = excluded.elapsed_time,
           zero_to_60_time = excluded.zero_to_60_time,
           zero_to_100_time = excluded.zero_to_100_time,
           hundred_to_200_time = excluded.hundred_to_200_time,
           source = excluded.source,
           raw_dragy_payload = excluded.raw_dragy_payload,
           created_at = datetime('now')`
      ).run({
        raceId,
        racerId: r.racerId,
        distance: r.distance,
        elapsedTime: r.elapsedTime,
        zeroToSixtyTime: r.zeroToSixtyTime ?? null,
        zeroToHundredTime: r.zeroToHundredTime,
        hundredToTwoHundredTime: r.hundredToTwoHundredTime,
        source: r.source ?? "manual",
        rawDragyPayload: r.rawDragyPayload ? JSON.stringify(r.rawDragyPayload) : null,
      });
    }
    db.prepare("UPDATE races SET status = 'completed' WHERE id = ?").run(raceId);
  });
  tx();
  publish();
}

/** Deletes a race and its results (results cascade on race_id). */
export function deleteRace(raceId: number) {
  const info = db.prepare("DELETE FROM races WHERE id = ?").run(raceId);
  if (info.changes === 0) throw new Error("Race not found");
  publish();
}

/** Clears a completed race's results and puts it back in the running order. */
export function clearRaceResults(raceId: number) {
  const tx = db.transaction((id: number) => {
    db.prepare("DELETE FROM results WHERE race_id = ?").run(id);
    db.prepare("UPDATE races SET status = 'pending' WHERE id = ?").run(id);
  });
  tx(raceId);
  publish();
}

/** Deletes a vehicle. Refuses while races still reference it, since those
 *  races would lose an entrant — delete the races first. */
export function deleteRacer(racerId: number) {
  const used = db
    .prepare("SELECT COUNT(*) AS n FROM races WHERE racer_a_id = ? OR racer_b_id = ?")
    .get(racerId, racerId) as { n: number };
  if (used.n > 0) {
    throw new Error(`Vehicle is in ${used.n} race(s) — delete those races first`);
  }
  const info = db.prepare("DELETE FROM racers WHERE id = ?").run(racerId);
  if (info.changes === 0) throw new Error("Vehicle not found");
  publish();
}

export type ResetScope = "results" | "races" | "all";

/** Bulk clear. "results" keeps the running order, "races" keeps the vehicles,
 *  "all" empties the event. Uploaded logo files are left on disk. */
export function resetEvent(scope: ResetScope) {
  const event = getOrCreateEvent();
  const tx = db.transaction(() => {
    if (scope === "results") {
      db.prepare("DELETE FROM results WHERE race_id IN (SELECT id FROM races WHERE event_id = ?)").run(event.id);
      db.prepare("UPDATE races SET status = 'pending' WHERE event_id = ?").run(event.id);
      return;
    }
    db.prepare("DELETE FROM races WHERE event_id = ?").run(event.id);
    if (scope === "all") {
      db.prepare("DELETE FROM racers WHERE event_id = ?").run(event.id);
    }
  });
  tx();
  publish();
}

export function getResultsForRace(raceId: number): Result[] {
  return db.prepare("SELECT * FROM results WHERE race_id = ?").all(raceId) as Result[];
}

export type PublicRace = Race & {
  racerA: Racer;
  racerB: Racer | null;
  results: Result[];
  winnerRacerId: number | null;
};

export type PublicState = {
  event: EventRow;
  racers: Racer[];
  currentRace: PublicRace | null;
  leaderboard: PublicRace[];
  upcoming: PublicRace[];
  /** Runs finished but not yet scored — may or may not be the one on screen. */
  awaitingResults: PublicRace[];
};

function hydrateRace(race: Race, racersById: Map<number, Racer>, metric: WinnerMetric): PublicRace {
  const results = getResultsForRace(race.id);
  const winnerRacerId =
    race.status === "completed"
      ? determineWinner(
          results.map((r) => ({
            racer_id: r.racer_id,
            elapsed_time: r.elapsed_time,
            zero_to_60_time: r.zero_to_60_time,
            zero_to_100_time: r.zero_to_100_time,
          })),
          metric
        )
      : null;
  return {
    ...race,
    racerA: racersById.get(race.racer_a_id)!,
    racerB: race.racer_b_id ? racersById.get(race.racer_b_id) ?? null : null,
    results,
    winnerRacerId,
  };
}

/** Full public snapshot — display and admin both resync from this on load/reconnect. */
export function getPublicState(): PublicState {
  const event = getOrCreateEvent();
  const racers = listRacers();
  const racersById = new Map(racers.map((r) => [r.id, r]));
  const races = listRaces();

  // A race lining up or running takes the screen over one still awaiting its
  // times, so timing can be relayed late without freezing the display.
  const currentRaceRow =
    races.find((r) => r.status === "staging" || r.status === "racing") ??
    races.find((r) => r.status === "awaiting_results") ??
    null;
  const completed = races.filter((r) => r.status === "completed");
  const pending = races.filter((r) => r.status === "pending");
  const awaiting = races.filter((r) => r.status === "awaiting_results");

  return {
    event,
    racers,
    currentRace: currentRaceRow ? hydrateRace(currentRaceRow, racersById, event.winner_metric) : null,
    leaderboard: completed.map((r) => hydrateRace(r, racersById, event.winner_metric)),
    upcoming: pending.map((r) => hydrateRace(r, racersById, event.winner_metric)),
    awaitingResults: awaiting.map((r) => hydrateRace(r, racersById, event.winner_metric)),
  };
}
