# Drag Race Telemetry

Live results display for a drag race event. Admin enters results after each
run on a walkie-talkie relay; a public screen (projector/TV) shows the
current race and an animated result reveal, then settles into a leaderboard.

## Architecture

Single Node process (Next.js), SQLite file DB, Server-Sent Events (SSE) for
push. No external services, no cloud dependency — everything runs on one
machine on the venue's local network. This matters because venue wifi often
has no real internet uplink; a design that depends on a cloud realtime layer
(Firebase/Supabase) would be a single point of failure at the exact moment
it can't be fixed. A full separate backend (Laravel/Go + Postgres + WS) would
add ops overhead this single-event use case doesn't need.

Reliability model: the display never trusts incremental push data. Every SSE
event (including periodic heartbeats) triggers a full re-fetch of
`/api/state`. A dropped connection, a missed event, or a hard reload always
converges back to the same correct state — there is no diff/patch path that
can leave it stale or half-updated.

## Running locally

```bash
npm install
npm run dev
```

- Admin panel: http://localhost:3000/admin
- Public display: http://localhost:3000/display

Data lives in `data/` (gitignored, created automatically): `telemetry.db` is
the SQLite database, `data/uploads/` holds vehicle logos. Delete the whole
`data/` directory to reset an event.

Logos are deliberately not stored in `public/` — Next snapshots that
directory's file list at build time, so anything uploaded at runtime would
404. They are served by `/api/logo/[file]` instead.

Note there is no migration system: the schema is created with
`CREATE TABLE IF NOT EXISTS`, which will not alter an existing table. If the
schema changes, delete `data/` and start fresh — fine before an event, never
during one.

## Tests

```bash
npm test
```

Covers winner determination (both metrics, missing data) and the result
overwrite path (admin corrections must replace, not duplicate).

## Event venue topology

Run the app on one laptop/mini-PC connected to the venue's local
wifi/router (no internet required). Find its LAN IP (`ip addr` / shown in
the `next dev` output as "Network:"), then:

- Admin: open `http://<host-ip>:3000/admin` on a phone/tablet over the same
  wifi.
- Display: open `http://<host-ip>:3000/display` on the machine driving the
  projector/TV (or point that machine's browser at `localhost:3000/display`
  if it's the same box).

For a real event, run `npm run build && npm run start` instead of `dev` —
same LAN topology, but a production build, no need for internet at all if
`node_modules` was installed ahead of time.

If wifi drops mid-event, the display shows a "Reconnecting…" badge and
resyncs automatically the moment the connection returns — nothing to
restart manually.

## Dragy integration

`lib/dragy.ts` defines `DragySessionProvider`, the single interface the admin
panel's "Pull from Dragy" button calls. It currently runs a stub
(`StubDragySessionProvider`) that returns fake session data after a short
delay, so the whole app works and demos without any real Dragy device.

To wire in the real [Dragy Open API](https://godragy.com/dragy-api) once you
have credentials and endpoint docs:

1. Implement a `RealDragySessionProvider` in `lib/dragy.ts` against Dragy's
   documented spec (don't guess at the shape — use the real docs).
2. Swap the exported `dragyProvider` to use it, gated behind an env var
   (e.g. `DRAGY_MODE=live`), keeping the stub as the default fallback.
3. If the real API is unreachable or returns nothing, `getLatestSession`
   must resolve to `null` rather than throw — `/api/dragy` already treats
   `null` as "fall back to manual entry", and the admin form never
   auto-publishes Dragy data without a human confirming it in the form
   first.

## Data model

- `events` — one row per venue run; `winner_metric` (`elapsed_time` or
  `top_speed`) is switchable from the admin panel.
- `racers` — the entrant is a vehicle: brand, model, optional logo.
- `races` — pairs vehicles, `status`: `pending` → `staging` → `racing` →
  `completed`. Only one race is `staging`/`racing` at a time. `staging` is
  "on the line", `racing` is "on the run" — the display shows a different
  view for each.
- `results` — one row per `(race, racer)`, `UNIQUE(race_id, racer_id)` so
  resubmitting a result overwrites the previous one instead of duplicating.
  `source` distinguishes `manual` entry from `dragy` pulls; `raw_dragy_payload`
  keeps the original payload for audit when sourced from Dragy.
