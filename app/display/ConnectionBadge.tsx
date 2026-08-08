"use client";

import type { ConnectionStatus } from "@/lib/client/useLiveState";
import { translator, type Lang } from "@/lib/i18n";

export function ConnectionBadge({ status, lang }: { status: ConnectionStatus; lang: Lang }) {
  if (status === "live") return null;

  const t = translator(lang);
  const label = status === "connecting" ? t("connecting") : t("reconnecting");
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-amber-500/90 px-4 py-2 text-sm font-semibold text-black shadow-lg">
      <span className="h-2 w-2 animate-pulse rounded-full bg-black" />
      {label}
    </div>
  );
}
