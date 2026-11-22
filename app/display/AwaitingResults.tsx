"use client";

import { motion } from "framer-motion";
import type { PublicRace } from "@/lib/store";
import type { Lang } from "@/lib/i18n";
import { translator } from "@/lib/i18n";
import { StageFrame, WipeText } from "./StageFrame";
import { VehiclePanel } from "./VehiclePanel";

/** status: awaiting_results — run is done, timing not relayed yet. */
export function AwaitingResults({
  race,
  logoScale,
  lang,
}: {
  race: PublicRace;
  logoScale: number;
  lang: Lang;
}) {
  const t = translator(lang);

  return (
    <StageFrame intensity="calm" accent="#f59e0b">
      <motion.div key={race.id} className="flex h-full flex-col items-center justify-center gap-10">
        <WipeText delay={0.1}>
          <div className="slant border-l-4 border-amber-500 bg-amber-500/15 px-10 py-3">
            <div className="unslant title-type text-7xl tracking-[0.28em] text-amber-300">
              {t("awaitingResultsTitle")}
            </div>
          </div>
        </WipeText>

        {/* Indeterminate progress: the wait has no known duration, so nothing
            here pretends to measure one. */}
        <div className="relative h-[3px] w-[55%] overflow-hidden bg-white/10">
          <motion.div
            animate={{ x: ["-120%", "520%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-amber-300 to-transparent"
          />
        </div>

        <div className="flex items-center gap-10">
          <VehiclePanel racer={race.racerA} side="left" delay={0.15} tone="dim" size="md" logoScale={logoScale} />
          {race.racerB && (
            <VehiclePanel racer={race.racerB} side="right" delay={0.22} tone="dim" size="md" logoScale={logoScale} />
          )}
        </div>

        <motion.div
          animate={{ opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3 text-sm font-semibold tracking-[0.4em] text-amber-500/80 uppercase"
        >
          {t("awaitingResultsSub")}
          <Dots />
        </motion.div>
      </motion.div>
    </StageFrame>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
        />
      ))}
    </span>
  );
}
