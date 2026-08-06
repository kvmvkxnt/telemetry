"use client";

import { useState } from "react";
import { useLiveState } from "@/lib/client/useLiveState";
import { api } from "@/lib/client/api";
import { ResultForm } from "./ResultForm";
import type { PublicRace } from "@/lib/store";

export default function AdminPage() {
  const { state, status } = useLiveState();
  const [editingRaceId, setEditingRaceId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!state) return <div className="p-8 text-neutral-400">Loading…</div>;

  const allRaces: PublicRace[] = [
    ...(state.currentRace ? [state.currentRace] : []),
    ...state.upcoming,
    ...state.leaderboard,
  ].sort((a, b) => a.id - b.id);

  const editingRace = allRaces.find((r) => r.id === editingRaceId) ?? null;

  async function guarded(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{state.event.name} — Admin</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status === "live" ? "bg-emerald-600" : "bg-amber-500 text-black"
            }`}
          >
            {status === "live" ? "Live" : status}
          </span>
        </header>

        {error && <div className="rounded-md bg-red-950 px-4 py-2 text-red-300">{error}</div>}

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Winner metric</div>
            <div className="flex gap-2">
              {(["elapsed_time", "top_speed"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => guarded(() => api.setWinnerMetric(m))}
                  className={`rounded-md px-3 py-1 text-sm ${
                    state.event.winner_metric === m ? "bg-red-600" : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {m === "elapsed_time" ? "Fastest time" : "Top speed"}
                </button>
              ))}
            </div>
          </div>
        </section>

        <RacerAndRaceSetup racers={state.racers} onError={setError} />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-300">Races</h2>
          {allRaces.length === 0 && <div className="text-neutral-500">No races yet — add racers and pair them above.</div>}
          {allRaces.map((race) => (
            <div key={race.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {race.racerA.name}
                    {race.racerB ? ` vs ${race.racerB.name}` : ""}
                  </div>
                  <div className="text-xs text-neutral-500 uppercase">{race.status.replace("_", " ")}</div>
                </div>
                <div className="flex gap-2">
                  {race.status === "pending" && (
                    <button
                      onClick={() => guarded(() => api.startRace(race.id))}
                      className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-semibold hover:bg-emerald-600"
                    >
                      Start
                    </button>
                  )}
                  {race.status !== "pending" && (
                    <button
                      onClick={() => setEditingRaceId(race.id)}
                      className="rounded-md bg-neutral-800 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-700"
                    >
                      {race.status === "completed" ? "Edit result" : "Enter result"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>

        {editingRace && (
          <ResultForm
            race={editingRace}
            onDone={() => {
              setEditingRaceId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function RacerAndRaceSetup({
  racers,
  onError,
}: {
  racers: PublicRace["racerA"][];
  onError: (e: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [racerAId, setRacerAId] = useState<string>("");
  const [racerBId, setRacerBId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function addRacer() {
    if (!name.trim()) return;
    setBusy(true);
    onError(null);
    try {
      await api.createRacer(name.trim(), vehicle.trim());
      setName("");
      setVehicle("");
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function addRace() {
    if (!racerAId) return;
    setBusy(true);
    onError(null);
    try {
      await api.createRace(Number(racerAId), racerBId ? Number(racerBId) : null);
      setRacerAId("");
      setRacerBId("");
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="mb-3 font-semibold">Add racer</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Racer name"
          className="mb-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2"
        />
        <input
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
          placeholder="Vehicle (optional)"
          className="mb-3 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2"
        />
        <button
          onClick={addRacer}
          disabled={busy || !name.trim()}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
        >
          Add racer
        </button>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="mb-3 font-semibold">Create race</div>
        <select
          value={racerAId}
          onChange={(e) => setRacerAId(e.target.value)}
          className="mb-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2"
        >
          <option value="">Racer A…</option>
          {racers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={racerBId}
          onChange={(e) => setRacerBId(e.target.value)}
          className="mb-3 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2"
        >
          <option value="">Racer B (optional)…</option>
          {racers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <button
          onClick={addRace}
          disabled={busy || !racerAId}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
        >
          Create race
        </button>
      </div>
    </section>
  );
}
