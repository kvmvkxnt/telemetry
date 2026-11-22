import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data", "telemetry.db");
if (dbPath !== ":memory:") fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ponytail: no migration framework. CREATE TABLE IF NOT EXISTS never alters an
// existing table, so added columns go through addColumn() below. Anything
// bigger than a new column (renames, constraint changes) still means deleting
// data/ and starting over — fine pre-event, never mid-event.
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    winner_metric TEXT NOT NULL DEFAULT 'elapsed_time'
      CHECK (winner_metric IN ('elapsed_time', 'top_speed', 'zero_to_60_time', 'zero_to_100_time'))
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
      CHECK (status IN ('pending', 'staging', 'racing', 'awaiting_results', 'completed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    racer_id INTEGER NOT NULL REFERENCES racers(id),
    distance REAL,
    elapsed_time REAL,
    top_speed REAL,
    zero_to_60_time REAL,
    zero_to_100_time REAL,
    hundred_to_200_time REAL,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'dragy')),
    raw_dragy_payload TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(race_id, racer_id)
  );
`);

/** Adds a column to an existing table if it isn't there yet. Table/column
 *  names are literals from this file, never user input. */
function addColumn(table: string, column: string, ddl: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

// Logo display size is a venue calibration knob: the right value depends on
// screen size and viewing distance, so it is tunable live from the admin panel.
addColumn("events", "logo_scale", "REAL NOT NULL DEFAULT 1");

// Display + admin language, switched from the admin panel.
addColumn("events", "language", "TEXT NOT NULL DEFAULT 'en'");

addColumn("results", "zero_to_60_time", "REAL");

// A CHECK constraint can't be widened in place in SQLite either — same
// rebuild-and-swap as migrateRaceStatuses below, guarded on the stored
// schema text so it runs once.
function migrateWinnerMetricCheck() {
  const row = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'events'")
    .get() as { sql: string } | undefined;
  if (!row || row.sql.includes("zero_to_60_time")) return;

  db.pragma("foreign_keys = OFF");
  db.exec(`
    BEGIN;
    CREATE TABLE events_migrated (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      winner_metric TEXT NOT NULL DEFAULT 'elapsed_time'
        CHECK (winner_metric IN ('elapsed_time', 'top_speed', 'zero_to_60_time', 'zero_to_100_time')),
      logo_scale REAL NOT NULL DEFAULT 1,
      language TEXT NOT NULL DEFAULT 'en'
    );
    INSERT INTO events_migrated (id, name, date, winner_metric, logo_scale, language)
      SELECT id, name, date, winner_metric, logo_scale, language FROM events;
    DROP TABLE events;
    ALTER TABLE events_migrated RENAME TO events;
    COMMIT;
  `);
  db.pragma("foreign_keys = ON");
}
migrateWinnerMetricCheck();

// A CHECK constraint can't be altered in place in SQLite, so widening the set
// of race statuses means rebuilding the table. Guarded on the stored schema
// text, so this runs once per database and is a no-op afterwards.
function migrateRaceStatuses() {
  const row = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'races'")
    .get() as { sql: string } | undefined;
  if (!row || row.sql.includes("awaiting_results")) return;

  db.pragma("foreign_keys = OFF");
  db.exec(`
    BEGIN;
    CREATE TABLE races_migrated (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      racer_a_id INTEGER NOT NULL REFERENCES racers(id),
      racer_b_id INTEGER REFERENCES racers(id),
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'staging', 'racing', 'awaiting_results', 'completed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO races_migrated (id, event_id, racer_a_id, racer_b_id, status, created_at)
      SELECT id, event_id, racer_a_id, racer_b_id, status, created_at FROM races;
    DROP TABLE races;
    ALTER TABLE races_migrated RENAME TO races;
    COMMIT;
  `);
  db.pragma("foreign_keys = ON");
}
migrateRaceStatuses();

export default db;
