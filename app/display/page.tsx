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
import { findRevealTarget, resultSignature } from "@/lib/reveal";

const REVEAL_DURATION_MS = 9000;

export default function DisplayPage() {
  const { state, status } = useLiveState();
  // The token forces a remount when the same race reveals twice in a row (a
  // corrected result): without it React reuses the component and the confetti
  // and count-ups never re-run.
  const [reveal, setReveal] = useState<{ race: PublicRace; token: number } | null>(null);
  const revealToken = useRef(0);
  const seenResults = useRef<Map<number, string> | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!state) return;

    // First snapshot ever: record what is already on the board so reloading
    // the display mid-event doesn't replay old reveals.
    if (seenResults.current === null) {
      seenResults.current = new Map(state.leaderboard.map((r) => [r.id, resultSignature(r)]));
      return;
    }

    const changed = findRevealTarget(state.leaderboard, seenResults.current);
    if (changed) {
      seenResults.current.set(changed.id, resultSignature(changed));
      revealToken.current += 1;
      setReveal({ race: changed, token: revealToken.current });
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => setReveal(null), REVEAL_DURATION_MS);
    }

    // Forget races that left the board, so a cleared race reveals again when
    // it is re-run rather than being remembered forever.
    for (const id of seenResults.current.keys()) {
      if (!state.leaderboard.some((r) => r.id === id)) seenResults.current.delete(id);
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
              reveal
                ? `reveal-${reveal.race.id}-${reveal.token}`
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
            {reveal ? (
              <ResultReveal
                race={reveal.race}
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
