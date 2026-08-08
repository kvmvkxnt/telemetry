"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Letterbox bars + vignette + optional speed field. Shared broadcast frame. */
export function StageFrame({
  children,
  intensity = "calm",
  accent = "#e11d2a",
}: {
  children: ReactNode;
  intensity?: "calm" | "fast";
  accent?: string;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="speed-far" />
        {intensity === "fast" && (
          <>
            <div className="speed-mid" />
            <div className="speed-near" />
          </>
        )}
      </div>

      <div className="vignette pointer-events-none absolute inset-0" />

      {/* Letterbox bars slide in — instant "this is a broadcast" cue. */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 top-0 h-[3px] origin-top"
        style={{ background: accent }}
      />
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 h-[3px] origin-bottom"
        style={{ background: accent }}
      />

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

/** Text that wipes in behind a moving mask, broadcast lower-third style. */
export function WipeText({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
      animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
