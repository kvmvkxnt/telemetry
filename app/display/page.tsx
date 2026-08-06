"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLiveState } from "@/lib/client/useLiveState";
import { ConnectionBadge } from "./ConnectionBadge";
import { RaceInProgress } from "./RaceInProgress";
import { ResultReveal } from "./ResultReveal";
import { Leaderboard } from "./Leaderboard";
import type { PublicRace } from "@/lib/store";

const REVEAL_DURATION_MS = 6000;

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
  }, [state, revealRace]);

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-2xl text-neutral-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black px-8 py-10 text-white">
      <ConnectionBadge status={status} />
      <div className="mb-8 text-center text-lg font-semibold tracking-widest text-neutral-500 uppercase">
        {state.event.name}
      </div>

      <div className="h-[calc(100%-4rem)]">
        <AnimatePresence mode="wait">
          {revealRace ? (
            <ResultReveal key="reveal" race={revealRace} metric={state.event.winner_metric} />
          ) : state.currentRace ? (
            <RaceInProgress key="current" race={state.currentRace} />
          ) : (
            <div key="board" className="flex h-full items-center justify-center">
              <Leaderboard races={state.leaderboard} metric={state.event.winner_metric} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
