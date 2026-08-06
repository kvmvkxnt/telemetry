"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PublicRace } from "@/lib/store";
import type { WinnerMetric } from "@/lib/winner";

export function Leaderboard({ races, metric }: { races: PublicRace[]; metric: WinnerMetric }) {
  const rows = races
    .flatMap((race) =>
      race.results.map((r) => ({
        race,
        racer: r.racer_id === race.racerA.id ? race.racerA : race.racerB,
        result: r,
        isWinner: race.winnerRacerId === r.racer_id,
      }))
    )
    .filter((row) => row.racer != null)
    .sort((a, b) => {
      if (metric === "elapsed_time") {
        return (a.result.elapsed_time ?? Infinity) - (b.result.elapsed_time ?? Infinity);
      }
      return (b.result.top_speed ?? -Infinity) - (a.result.top_speed ?? -Infinity);
    });

  if (rows.length === 0) {
    return <div className="flex h-full items-center justify-center text-3xl text-neutral-500">No results yet</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 text-center text-2xl font-bold tracking-widest text-neutral-400 uppercase">
        Leaderboard
      </div>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {rows.map((row, i) => (
            <motion.div
              key={`${row.race.id}-${row.racer!.id}`}
              layout
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className={`flex items-center justify-between rounded-xl border px-6 py-4 ${
                i === 0 ? "border-yellow-400 bg-yellow-400/10" : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 text-xl font-black text-neutral-500">{i + 1}</span>
                <span className="text-xl font-bold text-white">{row.racer!.name}</span>
              </div>
              <div className="flex gap-6 text-lg text-neutral-300">
                <span>{row.result.elapsed_time?.toFixed(2) ?? "–"}s</span>
                <span>{row.result.top_speed?.toFixed(1) ?? "–"} mph</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
