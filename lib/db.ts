import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data", "telemetry.db");
if (dbPath !== ":memory:") fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ponytail: no migration framework — CREATE TABLE IF NOT EXISTS never alters
// an existing table. A schema change means deleting data/ and starting over,
// which is fine pre-event (see README); it must not happen mid-event.
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    winner_metric TEXT NOT NULL DEFAULT 'elapsed_time'
      CHECK (winner_metric IN ('elapsed_time', 'top_speed'))
  );

  CREATE TABLE IF NOT EXISTS racers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    logo_url TEXT
  );

  CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    racer_a_id INTEGER NOT NULL REFERENCES racers(id),
    racer_b_id INTEGER REFERENCES racers(id),
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'staging', 'racing', 'completed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    racer_id INTEGER NOT NULL REFERENCES racers(id),
    distance REAL,
    elapsed_time REAL,
    top_speed REAL,
    zero_to_100_time REAL,
    hundred_to_200_time REAL,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'dragy')),
    raw_dragy_payload TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(race_id, racer_id)
  );
`);

export default db;
