"use client";

import { motion } from "framer-motion";
import type { PublicRace } from "@/lib/store";
import { translator, type Lang } from "@/lib/i18n";
import { StageFrame, WipeText } from "./StageFrame";
import { VehiclePanel } from "./VehiclePanel";

/** status: staging — cars are lined up, not launched yet. */
export function RaceInProgress({
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
    <StageFrame intensity="calm" accent="#e11d2a">
      <motion.div
        key={race.id}
        className="flex h-full flex-col items-center justify-center gap-12"
      >
        <WipeText delay={0.15}>
          <div className="slant border-l-4 border-red-600 bg-red-600/15 px-8 py-2">
            <div className="unslant title-type stage-pulse text-3xl tracking-[0.3em] text-red-500">
              {t("onTheLine")}
            </div>
          </div>
        </WipeText>

        <div className="flex items-center gap-10">
          <VehiclePanel racer={race.racerA} side="left" delay={0.25} logoScale={logoScale} />

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.34, 1.4, 0.64, 1] }}
            className="title-type text-7xl text-neutral-600"
          >
            VS
          </motion.div>

          {race.racerB && <VehiclePanel racer={race.racerB} side="right" delay={0.35} logoScale={logoScale} />}
        </div>

        <WipeText delay={0.7}>
          <div className="text-sm font-semibold tracking-[0.4em] text-neutral-600 uppercase">
            {t("awaitingLaunch")}
          </div>
        </WipeText>
      </motion.div>
    </StageFrame>
  );
}
