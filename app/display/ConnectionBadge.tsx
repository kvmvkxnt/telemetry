"use client";

import type { ConnectionStatus } from "@/lib/client/useLiveState";

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  if (status === "live") return null;

  const label = status === "connecting" ? "Connecting…" : "Reconnecting…";
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-amber-500/90 px-4 py-2 text-sm font-semibold text-black shadow-lg">
      <span className="h-2 w-2 animate-pulse rounded-full bg-black" />
      {label}
    </div>
  );
}
