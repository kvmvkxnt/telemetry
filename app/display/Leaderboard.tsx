"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PublicRace } from "@/lib/store";
import type { WinnerMetric } from "@/lib/winner";
import { StageFrame, WipeText } from "./StageFrame";
import { LogoBox } from "./LogoBox";
import { translator, type Lang } from "@/lib/i18n";

const ROW_LOGO_BASE = 52;

export function Leaderboard({
  races,
  metric,
  logoScale,
  lang,
}: {
  races: PublicRace[];
  metric: WinnerMetric;
  logoScale: number;
  lang: Lang;
}) {
  const t = translator(lang);
  const rows = races
    .flatMap((race) =>
      race.results.map((r) => ({
        race,
        racer: r.racer_id === race.racerA.id ? race.racerA : race.racerB,
        result: r,
      }))
    )
    .filter((row) => row.racer != null)
    .sort((a, b) => {
      if (metric === "elapsed_time") {
        return (a.result.elapsed_time ?? Infinity) - (b.result.elapsed_time ?? Infinity);
      }
      return (b.result.top_speed ?? -Infinity) - (a.result.top_speed ?? -Infinity);
    });

  return (
    <StageFrame intensity="calm" accent="#e11d2a">
      <div className="flex h-full flex-col items-center justify-center">
        {rows.length === 0 ? (
          <WipeText>
            <div className="title-type text-4xl text-neutral-600">{t("standingBy")}</div>
          </WipeText>
        ) : (
          <div className="w-full max-w-4xl">
            <WipeText>
              <div className="mb-8 text-center title-type text-3xl tracking-[0.35em] text-neutral-400">
                {t("leaderboard")}
              </div>
            </WipeText>

            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {rows.map((row, i) => (
                  <motion.div
                    key={`${row.race.id}-${row.racer!.id}`}
                    layout
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.55,
                      delay: Math.min(i * 0.06, 0.5),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`slant sweep relative flex items-center justify-between overflow-hidden border-l-4 px-8 py-4 ${
                      i === 0
                        ? "sweep-gold border-yellow-400 bg-yellow-400/12"
                        : "border-white/20 bg-white/[0.04]"
                    }`}
                  >
                    <div className="unslant flex items-center gap-5">
                      <span
                        className={`w-10 title-type text-3xl ${
                          i === 0 ? "text-yellow-400" : "text-neutral-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      {row.racer!.logo_url ? (
                        <LogoBox src={row.racer!.logo_url} height={ROW_LOGO_BASE * logoScale} />
                      ) : null}
                      <span className="title-type text-2xl text-white">
                        {row.racer!.brand}{" "}
                        <span className="font-semibold text-neutral-400 not-italic">
                          {row.racer!.model}
                        </span>
                      </span>
                    </div>
                    <div className="unslant flex gap-8 tabular-nums">
                      <span
                        className={
                          metric === "elapsed_time"
                            ? "text-2xl font-black text-yellow-300"
                            : "text-xl font-bold text-neutral-300"
                        }
                      >
                        {row.result.elapsed_time?.toFixed(2) ?? "–"}
                        <span className="ml-1 text-xs text-neutral-500">{t("unitSeconds")}</span>
                      </span>
                      <span
                        className={
                          metric === "top_speed"
                            ? "text-2xl font-black text-yellow-300"
                            : "text-xl font-bold text-neutral-300"
                        }
                      >
                        {row.result.top_speed?.toFixed(1) ?? "–"}
                        <span className="ml-1 text-xs text-neutral-500">{t("unitSpeed")}</span>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </StageFrame>
  );
}
