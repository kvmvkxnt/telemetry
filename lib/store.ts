import db from "./db";
import { determineWinner, type WinnerMetric } from "./winner";
import { publish } from "./bus";

export type Racer = {
  id: number;
  event_id: number;
  name: string;
  vehicle: string | null;
  photo_url: string | null;
};

export type Race = {
  id: number;
  event_id: number;
  racer_a_id: number;
  racer_b_id: number | null;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
};

export type Result = {
  id: number;
  race_id: number;
  racer_id: number;
  distance: number | null;
  elapsed_time: number | null;
  top_speed: number | null;
  zero_to_100_time: number | null;
  hundred_to_200_time: number | null;
  source: "manual" | "dragy";
  raw_dragy_payload: string | null;
  created_at: string;
};

// Single-event-per-instance app (see README topology). Event row 1 always exists.
export function getOrCreateEvent() {
  const existing = db.prepare("SELECT * FROM events WHERE id = 1").get();
  if (existing) return existing as { id: number; name: string; date: string; winner_metric: WinnerMetric };
  db.prepare(
    "INSERT INTO events (id, name, date, winner_metric) VALUES (1, ?, ?, 'elapsed_time')"
  ).run("Drag Race Event", new Date().toISOString().slice(0, 10));
  return db.prepare("SELECT * FROM events WHERE id = 1").get() as {
    id: number;
    name: string;
    date: string;
    winner_metric: WinnerMetric;
  };
}

export function setWinnerMetric(metric: WinnerMetric) {
  getOrCreateEvent();
  db.prepare("UPDATE events SET winner_metric = ? WHERE id = 1").run(metric);
  publish();
}

export function listRacers(): Racer[] {
  const event = getOrCreateEvent();
  return db.prepare("SELECT * FROM racers WHERE event_id = ? ORDER BY id").all(event.id) as Racer[];
}

export function createRacer(name: string, vehicle: string | null, photoUrl: string | null): Racer {
  if (!name.trim()) throw new Error("Racer name is required");
  const event = getOrCreateEvent();
  const info = db
    .prepare("INSERT INTO racers (event_id, name, vehicle, photo_url) VALUES (?, ?, ?, ?)")
    .run(event.id, name.trim(), vehicle, photoUrl);
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
  return db.prepare("SELECT * FROM races WHERE id = ?").get(info.lastInsertRowid) as Race;
}

/** Marks a race in_progress. Only one race is in_progress at a time. */
export function startRace(raceId: number) {
  const tx = db.transaction((id: number) => {
    db.prepare(
      "UPDATE races SET status = 'pending' WHERE status = 'in_progress' AND id != ?"
    ).run(id);
    db.prepare("UPDATE races SET status = 'in_progress' WHERE id = ?").run(id);
  });
  tx(raceId);
  publish();
}

export type ResultInput = {
  racerId: number;
  distance: number | null;
  elapsedTime: number | null;
  topSpeed: number | null;
  zeroToHundredTime: number | null;
  hundredToTwoHundredTime: number | null;
  source?: "manual" | "dragy";
  rawDragyPayload?: unknown;
};

function validateResult(r: ResultInput) {
  const fields: [string, number | null][] = [
    ["distance", r.distance],
    ["elapsed_time", r.elapsedTime],
    ["top_speed", r.topSpeed],
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
          (race_id, racer_id, distance, elapsed_time, top_speed, zero_to_100_time, hundred_to_200_time, source, raw_dragy_payload)
         VALUES (@raceId, @racerId, @distance, @elapsedTime, @topSpeed, @zeroToHundredTime, @hundredToTwoHundredTime, @source, @rawDragyPayload)
         ON CONFLICT(race_id, racer_id) DO UPDATE SET
           distance = excluded.distance,
           elapsed_time = excluded.elapsed_time,
           top_speed = excluded.top_speed,
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
        topSpeed: r.topSpeed,
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
  event: { id: number; name: string; date: string; winner_metric: WinnerMetric };
  racers: Racer[];
  currentRace: PublicRace | null;
  leaderboard: PublicRace[];
  upcoming: PublicRace[];
};

function hydrateRace(race: Race, racersById: Map<number, Racer>, metric: WinnerMetric): PublicRace {
  const results = getResultsForRace(race.id);
  const winnerRacerId =
    race.status === "completed"
      ? determineWinner(
          results.map((r) => ({
            racer_id: r.racer_id,
            elapsed_time: r.elapsed_time,
            top_speed: r.top_speed,
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

  const currentRaceRow = races.find((r) => r.status === "in_progress") ?? null;
  const completed = races.filter((r) => r.status === "completed");
  const pending = races.filter((r) => r.status === "pending");

  return {
    event,
    racers,
    currentRace: currentRaceRow ? hydrateRace(currentRaceRow, racersById, event.winner_metric) : null,
    leaderboard: completed.map((r) => hydrateRace(r, racersById, event.winner_metric)),
    upcoming: pending.map((r) => hydrateRace(r, racersById, event.winner_metric)),
  };
}
