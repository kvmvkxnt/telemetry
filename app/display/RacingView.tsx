"use client";

import { motion } from "framer-motion";
import type { PublicRace } from "@/lib/store";
import { translator, type Lang } from "@/lib/i18n";
import { StageFrame, WipeText } from "./StageFrame";
import { VehiclePanel } from "./VehiclePanel";

/** status: racing — cars are on the run. Speed comes from the field and the
 *  light bar, not from moving the cards. Panels stay rock steady. */
export function RacingView({
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
    <StageFrame intensity="fast" accent="#10b981">
      <motion.div key={race.id} className="flex h-full flex-col items-center justify-center gap-12">
        <WipeText delay={0.05}>
          <div className="slant relative overflow-hidden border-l-4 border-emerald-400 bg-emerald-400/15 px-10 py-3">
            <div className="unslant title-type text-4xl tracking-[0.3em] text-emerald-300">
              {t("racingLabel")}
            </div>
          </div>
        </WipeText>

        {/* Light bar scanning the width — reads as motion without jitter. */}
        <div className="relative h-[3px] w-[70%] overflow-hidden bg-white/10">
          <motion.div
            animate={{ x: ["-100%", "500%"] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-1/5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent"
          />
        </div>

        <div className="flex items-center gap-10">
          <VehiclePanel racer={race.racerA} side="left" delay={0.1} tone="live" logoScale={logoScale} />
          {race.racerB && (
            <VehiclePanel racer={race.racerB} side="right" delay={0.18} tone="live" logoScale={logoScale} />
          )}
        </div>

        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="text-sm font-semibold tracking-[0.4em] text-emerald-500/80 uppercase"
        >
          {t("runInProgress")}
        </motion.div>
      </motion.div>
    </StageFrame>
  );
}
