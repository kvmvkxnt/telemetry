"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLiveState } from "@/lib/client/useLiveState";
import { ConnectionBadge } from "./ConnectionBadge";
import { RaceInProgress } from "./RaceInProgress";
import { RacingView } from "./RacingView";
import { ResultReveal } from "./ResultReveal";
import { Leaderboard } from "./Leaderboard";
import { AwaitingResults } from "./AwaitingResults";
import type { PublicRace } from "@/lib/store";

const REVEAL_DURATION_MS = 9000;

export default function DisplayPage() {
  const { state, status } = useLiveState();
  const [revealRace, setRevealRace] = useState<PublicRace | null>(null);
  const seenCompletedIds = useRef<Set<number> | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!state) return;

    // First snapshot ever: mark existing completed races as already-seen so
    // reloading the display mid-event doesn't replay old reveals.
    if (seenCompletedIds.current === null) {
      seenCompletedIds.current = new Set(state.leaderboard.map((r) => r.id));
      return;
    }

    const newlyCompleted = state.leaderboard.find((r) => !seenCompletedIds.current!.has(r.id));
    if (newlyCompleted) {
      seenCompletedIds.current!.add(newlyCompleted.id);
      setRevealRace(newlyCompleted);
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => setRevealRace(null), REVEAL_DURATION_MS);
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-2xl text-neutral-600">
        Loading…
      </div>
    );
  }

  const lang = state.event.language;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050505] text-white">
      <ConnectionBadge status={status} lang={lang} />

      <div className="absolute inset-x-0 top-5 z-20 text-center text-sm font-semibold tracking-[0.45em] text-neutral-600 uppercase">
        {state.event.name}
      </div>

      <div className="h-full px-10 pt-16 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={
              revealRace
                ? `reveal-${revealRace.id}`
                : state.currentRace
                  ? `${state.currentRace.status}-${state.currentRace.id}`
                  : "board"
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="h-full"
          >
            {revealRace ? (
              <ResultReveal
                race={revealRace}
                metric={state.event.winner_metric}
                logoScale={state.event.logo_scale}
                lang={lang}
              />
            ) : state.currentRace?.status === "staging" ? (
              <RaceInProgress race={state.currentRace} logoScale={state.event.logo_scale} lang={lang} />
            ) : state.currentRace?.status === "racing" ? (
              <RacingView race={state.currentRace} logoScale={state.event.logo_scale} lang={lang} />
            ) : state.currentRace?.status === "awaiting_results" ? (
              <AwaitingResults
                race={state.currentRace}
                logoScale={state.event.logo_scale}
                lang={lang}
              />
            ) : (
              <Leaderboard
                races={state.leaderboard}
                metric={state.event.winner_metric}
                logoScale={state.event.logo_scale}
                lang={lang}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
