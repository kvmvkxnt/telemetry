"use client";

import { motion } from "framer-motion";
import type { PublicRace } from "@/lib/store";

export function RaceInProgress({ race }: { race: PublicRace }) {
  return (
    <motion.div
      key={race.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col items-center justify-center gap-10"
    >
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        className="rounded-full bg-red-600 px-6 py-2 text-2xl font-black tracking-widest text-white uppercase"
      >
        On the line
      </motion.div>

      <div className="flex items-center gap-16">
        <RacerCard name={race.racerA.name} vehicle={race.racerA.vehicle} side="left" />
        <div className="text-6xl font-black text-neutral-500">VS</div>
        {race.racerB && <RacerCard name={race.racerB.name} vehicle={race.racerB.vehicle} side="right" />}
      </div>
    </motion.div>
  );
}

function RacerCard({ name, vehicle, side }: { name: string; vehicle: string | null; side: "left" | "right" }) {
  return (
    <motion.div
      initial={{ x: side === "left" ? -60 : 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="w-[420px] rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur"
    >
      <div className="text-5xl font-extrabold text-white">{name}</div>
      {vehicle && <div className="mt-3 text-xl text-neutral-400">{vehicle}</div>}
    </motion.div>
  );
}
