"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import type { PublicRace, Result, Racer } from "@/lib/store";
import type { WinnerMetric } from "@/lib/winner";
import { useCountUp } from "@/lib/client/useCountUp";
import { StageFrame, WipeText } from "./StageFrame";

const RESULT_LOGO_BASE = 110;

export function ResultReveal({
  race,
  metric,
  logoScale,
}: {
  race: PublicRace;
  metric: WinnerMetric;
  logoScale: number;
}) {
  useEffect(() => {
    if (race.winnerRacerId == null) return;
    // Two bursts: an immediate pop, then side cannons as the winner lands.
    const t = setTimeout(() => {
      confetti({ particleCount: 90, spread: 100, startVelocity: 45, origin: { y: 0.35 } });
      const end = Date.now() + 1600;
      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 70, startVelocity: 55, origin: { x: 0, y: 0.7 } });
        confetti({ particleCount: 4, angle: 120, spread: 70, startVelocity: 55, origin: { x: 1, y: 0.7 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }, 700);
    return () => clearTimeout(t);
  }, [race.id, race.winnerRacerId]);

  const resultFor = (racerId: number) => race.results.find((r) => r.racer_id === racerId) ?? null;

  return (
    <StageFrame intensity="calm" accent="#facc15">
      <motion.div key={race.id} className="flex h-full flex-col items-center justify-center gap-8">
        {/* Checkered flag wipes across the screen to open the reveal. */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="checkered-flag h-7 w-full origin-left"
        />

        <WipeText delay={0.35}>
          <div className="title-type text-3xl tracking-[0.35em] text-neutral-400">Result</div>
        </WipeText>

        <div className="flex items-stretch gap-10">
          <ResultCard
            racer={race.racerA}
            result={resultFor(race.racerA.id)}
            isWinner={race.winnerRacerId === race.racerA.id}
            metric={metric}
            side="left"
            delay={0.5}
            logoScale={logoScale}
          />
          {race.racerB && (
            <ResultCard
              racer={race.racerB}
              result={resultFor(race.racerB.id)}
              isWinner={race.winnerRacerId === race.racerB.id}
              metric={metric}
              side="right"
              delay={0.62}
              logoScale={logoScale}
            />
          )}
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="checkered-flag h-7 w-full origin-right"
        />
      </motion.div>
    </StageFrame>
  );
}

function ResultCard({
  racer,
  result,
  isWinner,
  metric,
  side,
  delay,
  logoScale,
}: {
  racer: Racer;
  result: Result | null;
  isWinner: boolean;
  metric: WinnerMetric;
  side: "left" | "right";
  delay: number;
  logoScale: number;
}) {
  const elapsed = useCountUp(result?.elapsed_time ?? 0, 1600);
  const speed = useCountUp(result?.top_speed ?? 0, 1600);

  return (
    <motion.div
      initial={{ x: side === "left" ? -140 : 140, opacity: 0 }}
      animate={{ x: 0, opacity: isWinner ? 1 : 0.6 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`slant sweep ${isWinner ? "sweep-gold" : ""} relative w-[440px] overflow-hidden border-2 px-10 py-8 ${
        isWinner ? "border-yellow-400 bg-yellow-400/12" : "border-white/10 bg-white/[0.04]"
      }`}
      style={
        isWinner ? { boxShadow: "0 0 70px 6px rgba(250,204,21,0.35)" } : undefined
      }
    >
      <div className="unslant">
        {isWinner && (
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: delay + 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 text-center title-type text-xl tracking-[0.3em] text-yellow-400"
          >
            ★ Winner ★
          </motion.div>
        )}

        <div className="flex flex-col items-center gap-2 text-center">
          {racer.logo_url ? (
            <motion.img
              src={racer.logo_url}
              alt=""
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.55, delay: delay + 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: RESULT_LOGO_BASE * logoScale }}
              className="w-auto max-w-full object-contain"
            />
          ) : null}
          <div className="title-type text-4xl leading-none text-white">{racer.brand}</div>
          <div className="mb-4 text-sm font-semibold tracking-[0.25em] text-neutral-400 uppercase">
            {racer.model}
          </div>
        </div>

        <div className="space-y-1.5">
          <Metric label="Elapsed" value={elapsed} unit="s" emphasize={metric === "elapsed_time"} delay={delay} />
          <Metric label="Top Speed" value={speed} unit="mph" emphasize={metric === "top_speed"} delay={delay} />
          {result?.zero_to_100_time != null && (
            <Metric label="0-100" value={result.zero_to_100_time} unit="s" delay={delay} />
          )}
          {result?.hundred_to_200_time != null && (
            <Metric label="100-200" value={result.hundred_to_200_time} unit="s" delay={delay} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Metric({
  label,
  value,
  unit,
  emphasize,
  delay,
}: {
  label: string;
  value: number;
  unit: string;
  emphasize?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      animate={{ clipPath: "inset(0 0% 0 0)" }}
      transition={{ duration: 0.6, delay: delay + 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-baseline justify-between border-b border-white/10 pb-1 ${
        emphasize ? "text-yellow-300" : "text-neutral-300"
      }`}
    >
      <span className="text-xs font-semibold tracking-[0.2em] uppercase">{label}</span>
      <span className={`tabular-nums ${emphasize ? "text-3xl font-black" : "text-xl font-bold"}`}>
        {value.toFixed(2)}
        <span className="ml-1 text-xs text-neutral-500">{unit}</span>
      </span>
    </motion.div>
  );
}
