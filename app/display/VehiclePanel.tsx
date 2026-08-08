"use client";

import { motion } from "framer-motion";
import type { Racer } from "@/lib/store";

/** Slanted broadcast card: logo, brand, model. Slides in from its own side. */
export function VehiclePanel({
  racer,
  side,
  delay = 0,
  tone = "neutral",
  size = "lg",
}: {
  racer: Racer;
  side: "left" | "right";
  delay?: number;
  tone?: "neutral" | "live" | "gold" | "dim";
  size?: "lg" | "md";
}) {
  const toneClass = {
    neutral: "border-white/15 bg-white/[0.06]",
    live: "border-emerald-400/50 bg-emerald-400/10",
    gold: "border-yellow-400 bg-yellow-400/12",
    dim: "border-white/10 bg-white/[0.03]",
  }[tone];

  return (
    <motion.div
      initial={{ x: side === "left" ? -120 : 120, opacity: 0 }}
      animate={{ x: 0, opacity: tone === "dim" ? 0.55 : 1 }}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`slant sweep ${tone === "gold" ? "sweep-gold" : ""} relative overflow-hidden border-2 ${toneClass} ${
        size === "lg" ? "w-[420px] px-12 py-10" : "w-[360px] px-10 py-8"
      }`}
    >
      <div className="unslant flex flex-col items-center gap-4 text-center">
        {racer.logo_url ? (
          <motion.img
            src={racer.logo_url}
            alt=""
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: delay + 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`${size === "lg" ? "h-24" : "h-16"} w-auto object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.25)]`}
          />
        ) : null}
        <div
          className={`title-type leading-none text-white ${size === "lg" ? "text-5xl" : "text-4xl"}`}
        >
          {racer.brand}
        </div>
        <div
          className={`font-semibold tracking-[0.2em] text-neutral-400 uppercase ${
            size === "lg" ? "text-xl" : "text-base"
          }`}
        >
          {racer.model}
        </div>
      </div>
    </motion.div>
  );
}
