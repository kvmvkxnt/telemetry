"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PublicRace } from "@/lib/store";
import type { WinnerMetric } from "@/lib/winner";
import { StageFrame, WipeText } from "./StageFrame";
import { LogoBox } from "./LogoBox";
import { translator, type Lang } from "@/lib/i18n";

const ROW_LOGO_BASE = 52;

const STAT_COLUMNS = [
  { metric: "elapsed_time", label: "elapsed", unit: "unitSeconds", digits: 2 },
  { metric: "zero_to_60_time", label: "zeroTo60", unit: "unitSeconds", digits: 2 },
  { metric: "zero_to_100_time", label: "zeroTo100", unit: "unitSeconds", digits: 2 },
] as const;

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
    .sort((a, b) => (a.result[metric] ?? Infinity) - (b.result[metric] ?? Infinity));

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

            <div className="mb-1 flex items-center justify-between px-8">
              <span className="w-10" />
              <span className="flex-1" />
              <div className="flex gap-6 tabular-nums">
                {STAT_COLUMNS.map((col) => (
                  <span
                    key={col.metric}
                    className={`w-24 text-right text-xs font-semibold tracking-[0.15em] uppercase ${
                      metric === col.metric ? "text-red-400" : "text-neutral-600"
                    }`}
                  >
                    {t(col.label)}
                  </span>
                ))}
              </div>
            </div>

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
                    className="slant sweep relative flex items-center justify-between overflow-hidden border-l-4 border-white/20 bg-white/[0.04] px-8 py-4"
                  >
                    <div className="unslant flex items-center gap-5">
                      <span className="w-10 title-type text-3xl text-neutral-600">{i + 1}</span>
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
                    <div className="unslant flex gap-6 tabular-nums">
                      {STAT_COLUMNS.map((col) => {
                        const value = row.result[col.metric];
                        const emphasize = metric === col.metric;
                        return (
                          <span
                            key={col.metric}
                            className={`w-24 text-right ${
                              emphasize ? "text-xl font-black text-red-400" : "text-base font-bold text-neutral-300"
                            }`}
                          >
                            {value?.toFixed(col.digits) ?? "–"}
                            <span className="ml-1 text-xs text-neutral-500">{t(col.unit)}</span>
                          </span>
                        );
                      })}
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
