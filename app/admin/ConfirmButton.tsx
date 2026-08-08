"use client";

import { useEffect, useRef, useState } from "react";

/** Destructive actions are never one click: the button arms first, then
 *  fires, and disarms itself after a few seconds if left untouched. */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className = "",
  armedClassName = "bg-red-600 hover:bg-red-500",
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  className?: string;
  armedClassName?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!armed) return;
    timer.current = setTimeout(() => setArmed(false), 4000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [armed]);

  return (
    <button
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        setArmed(false);
        void onConfirm();
      }}
      className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
        armed ? armedClassName : className
      }`}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
