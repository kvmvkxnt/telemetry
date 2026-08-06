"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import type { PublicRace, Result } from "@/lib/store";
import type { WinnerMetric } from "@/lib/winner";
import { useCountUp } from "@/lib/client/useCountUp";

export function ResultReveal({ race, metric }: { race: PublicRace; metric: WinnerMetric }) {
  useEffect(() => {
    if (race.winnerRacerId == null) return;
    const duration = 1500;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 } });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [race.id, race.winnerRacerId]);

  const resultFor = (racerId: number) => race.results.find((r) => r.racer_id === racerId) ?? null;

  return (
    <motion.div
      key={race.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex h-full flex-col items-center justify-center gap-10"
    >
      <div className="text-2xl font-bold tracking-widest text-neutral-400 uppercase">Result</div>
      <div className="flex items-start gap-12">
        <ResultCard
          name={race.racerA.name}
          result={resultFor(race.racerA.id)}
          isWinner={race.winnerRacerId === race.racerA.id}
          metric={metric}
        />
        {race.racerB && (
          <ResultCard
            name={race.racerB.name}
            result={resultFor(race.racerB.id)}
            isWinner={race.winnerRacerId === race.racerB.id}
            metric={metric}
          />
        )}
      </div>
    </motion.div>
  );
}

function ResultCard({
  name,
  result,
  isWinner,
  metric,
}: {
  name: string;
  result: Result | null;
  isWinner: boolean;
  metric: WinnerMetric;
}) {
  const elapsed = useCountUp(result?.elapsed_time ?? 0);
  const speed = useCountUp(result?.top_speed ?? 0);

  return (
    <motion.div
      animate={
        isWinner
          ? { scale: [1, 1.05, 1], boxShadow: "0 0 60px 10px rgba(250,204,21,0.5)" }
          : { opacity: 0.7 }
      }
      transition={{ duration: 0.8 }}
      className={`w-[380px] rounded-2xl border p-8 text-center ${
        isWinner ? "border-yellow-400 bg-yellow-400/10" : "border-white/10 bg-white/5"
      }`}
    >
      {isWinner && <div className="mb-2 text-4xl">🏆</div>}
      <div className="text-3xl font-bold text-white">{name}</div>
      <div className="mt-6 space-y-2">
        <Metric label="Elapsed" value={elapsed} unit="s" emphasize={metric === "elapsed_time"} />
        <Metric label="Top Speed" value={speed} unit="mph" emphasize={metric === "top_speed"} />
        {result?.zero_to_100_time != null && (
          <Metric label="0-100" value={result.zero_to_100_time} unit="s" />
        )}
        {result?.hundred_to_200_time != null && (
          <Metric label="100-200" value={result.hundred_to_200_time} unit="s" />
        )}
      </div>
    </motion.div>
  );
}

function Metric({
  label,
  value,
  unit,
  emphasize,
}: {
  label: string;
  value: number;
  unit: string;
  emphasize?: boolean;
}) {
  return (
    <div className={`flex justify-between text-lg ${emphasize ? "font-black text-yellow-300" : "text-neutral-300"}`}>
      <span>{label}</span>
      <span>
        {value.toFixed(2)} {unit}
      </span>
    </div>
  );
}
