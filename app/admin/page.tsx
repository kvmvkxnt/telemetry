"use client";

import { useState } from "react";
import { useLiveState } from "@/lib/client/useLiveState";
import { api } from "@/lib/client/api";
import { ResultForm } from "./ResultForm";
import { ConfirmButton } from "./ConfirmButton";
import type { PublicRace, Racer } from "@/lib/store";

function vehicleName(r: Racer) {
  return `${r.brand} ${r.model}`;
}

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

        <LogoSizeControl scale={state.event.logo_scale} onError={setError} />

        <RacerAndRaceSetup racers={state.racers} onError={setError} />

        {state.racers.length > 0 && (
          <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="mb-3 font-semibold">Vehicles</div>
            <div className="flex flex-wrap gap-3">
              {state.racers.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2"
                >
                  {r.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.logo_url} alt="" className="h-8 w-8 object-contain" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded border border-dashed border-neutral-600 text-[10px] text-neutral-500">
                      —
                    </span>
                  )}
                  <span className="text-sm">{vehicleName(r)}</span>
                  <button
                    onClick={() => guarded(() => api.deleteRacer(r.id))}
                    title="Delete vehicle"
                    className="ml-1 text-neutral-600 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-300">Races</h2>
          {allRaces.length === 0 && <div className="text-neutral-500">No races yet — add racers and pair them above.</div>}
          {allRaces.map((race) => (
            <div key={race.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {race.racerA.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={race.racerA.logo_url} alt="" className="h-8 w-8 object-contain" />
                  )}
                  {race.racerB?.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={race.racerB.logo_url} alt="" className="h-8 w-8 object-contain" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {vehicleName(race.racerA)}
                      {race.racerB ? ` vs ${vehicleName(race.racerB)}` : ""}
                    </div>
                    <div className="text-xs text-neutral-500 uppercase">{race.status}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {race.status === "pending" && (
                    <button
                      onClick={() => guarded(() => api.stageRace(race.id))}
                      className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold hover:bg-amber-500"
                    >
                      Line up
                    </button>
                  )}
                  {race.status === "staging" && (
                    <button
                      onClick={() => guarded(() => api.launchRace(race.id))}
                      className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-semibold hover:bg-emerald-600"
                    >
                      Start race
                    </button>
                  )}
                  {(race.status === "racing" || race.status === "completed") && (
                    <button
                      onClick={() => setEditingRaceId(race.id)}
                      className="rounded-md bg-neutral-800 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-700"
                    >
                      {race.status === "completed" ? "Edit result" : "Enter result"}
                    </button>
                  )}
                  {race.status === "completed" && (
                    <ConfirmButton
                      label="Clear result"
                      confirmLabel="Clear — sure?"
                      onConfirm={() => guarded(() => api.clearRaceResults(race.id))}
                      className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      armedClassName="bg-amber-600 hover:bg-amber-500"
                    />
                  )}
                  <ConfirmButton
                    label="Delete"
                    confirmLabel="Delete — sure?"
                    onConfirm={() => guarded(() => api.deleteRace(race.id))}
                    className="bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                  />
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

        <section className="rounded-xl border border-red-900/60 bg-red-950/20 p-5">
          <div className="mb-1 font-semibold text-red-300">Danger zone</div>
          <p className="mb-4 text-sm text-neutral-400">
            Bulk clears. These push to the display immediately and cannot be undone.
          </p>
          <div className="flex flex-wrap gap-3">
            <ConfirmButton
              label="Clear all results"
              confirmLabel="Clear all results — sure?"
              onConfirm={() => guarded(() => api.reset("results"))}
              className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              armedClassName="bg-amber-600 hover:bg-amber-500"
            />
            <ConfirmButton
              label="Delete all races"
              confirmLabel="Delete all races — sure?"
              onConfirm={() => guarded(() => api.reset("races"))}
              className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            />
            <ConfirmButton
              label="Reset everything"
              confirmLabel="Wipe races + vehicles — sure?"
              onConfirm={() => guarded(() => api.reset("all"))}
              className="bg-red-900/70 text-red-200 hover:bg-red-800"
            />
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Clear results keeps the running order · Delete races keeps the vehicles ·
            Reset everything keeps only the event itself
          </p>
        </section>
      </div>
    </div>
  );
}

function LogoSizeControl({
  scale,
  onError,
}: {
  scale: number;
  onError: (e: string | null) => void;
}) {
  // Local value so dragging stays smooth; committed on release.
  const [value, setValue] = useState(scale);
  const [dragging, setDragging] = useState(false);

  // Track server state unless the operator is actively dragging.
  if (!dragging && value !== scale) setValue(scale);

  async function commit(next: number) {
    onError(null);
    try {
      await api.setLogoScale(next);
    } catch (e) {
      onError((e as Error).message);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-semibold">Logo size on display</div>
        <span className="tabular-nums text-sm text-neutral-400">{value.toFixed(2)}×</span>
      </div>
      <p className="mb-3 text-sm text-neutral-500">
        Set this while watching the actual screen — the right size depends on the
        projector and how far back the crowd stands.
      </p>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.05}
          value={value}
          onChange={(e) => {
            setDragging(true);
            setValue(Number(e.target.value));
          }}
          onMouseUp={() => {
            setDragging(false);
            void commit(value);
          }}
          onTouchEnd={() => {
            setDragging(false);
            void commit(value);
          }}
          className="flex-1 accent-red-600"
        />
        <button
          onClick={() => {
            setValue(1);
            void commit(1);
          }}
          className="rounded-md bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
        >
          Reset
        </button>
      </div>
    </section>
  );
}

function RacerAndRaceSetup({ racers, onError }: { racers: Racer[]; onError: (e: string | null) => void }) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [racerAId, setRacerAId] = useState<string>("");
  const [racerBId, setRacerBId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function onLogoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    onError(null);
    try {
      const { url } = await api.uploadLogo(file);
      setLogoUrl(url);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function addRacer() {
    if (!brand.trim() || !model.trim()) return;
    setBusy(true);
    onError(null);
    try {
      await api.createRacer(brand.trim(), model.trim(), logoUrl);
      setBrand("");
      setModel("");
      setLogoUrl(null);
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
        <div className="mb-3 font-semibold">Add vehicle</div>
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Brand (e.g. Toyota)"
          className="mb-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2"
        />
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Model (e.g. Supra)"
          className="mb-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2"
        />
        <label className="mb-3 flex items-center gap-3 text-sm text-neutral-400">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-10 w-10 rounded-md border border-neutral-700 object-contain" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-neutral-700 text-xs">
              logo
            </span>
          )}
          <span>{uploading ? "Uploading…" : "Upload logo (optional)"}</span>
          <input type="file" accept="image/*" onChange={onLogoSelected} className="hidden" />
        </label>
        <button
          onClick={addRacer}
          disabled={busy || !brand.trim() || !model.trim()}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
        >
          Add vehicle
        </button>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="mb-3 font-semibold">Create race</div>
        <select
          value={racerAId}
          onChange={(e) => setRacerAId(e.target.value)}
          className="mb-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2"
        >
          <option value="">Vehicle A…</option>
          {racers.map((r) => (
            <option key={r.id} value={r.id}>
              {vehicleName(r)}
            </option>
          ))}
        </select>
        <select
          value={racerBId}
          onChange={(e) => setRacerBId(e.target.value)}
          className="mb-3 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2"
        >
          <option value="">Vehicle B (optional)…</option>
          {racers.map((r) => (
            <option key={r.id} value={r.id}>
              {vehicleName(r)}
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
