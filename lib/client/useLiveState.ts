"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicState } from "@/lib/store";

export type ConnectionStatus = "connecting" | "live" | "reconnecting";

/**
 * Polls /api/state once on mount, then re-fetches the FULL state on every
 * SSE "changed"/"heartbeat" event and on reconnect. Never trusts partial
 * push payloads — a dropped/duplicate event can't leave stale data on
 * screen, which matters most for the public display at a live event.
 */
export function useLiveState() {
  const [state, setState] = useState<PublicState | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const retryDelay = useRef(1000);

  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const refetch = async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (!res.ok) throw new Error(`state fetch failed: ${res.status}`);
        const data = (await res.json()) as PublicState;
        if (!cancelled) setState(data);
      } catch {
        // Keep showing last-known-good state; SSE connect/reconnect logic
        // below governs the status indicator, not this fetch.
      }
    };

    const connect = () => {
      setStatus((s) => (s === "live" ? s : "connecting"));
      es = new EventSource("/api/stream");

      es.addEventListener("open", () => {
        retryDelay.current = 1000;
        setStatus("live");
        refetch();
      });

      es.addEventListener("changed", refetch);
      es.addEventListener("heartbeat", () => setStatus("live"));

      es.onerror = () => {
        setStatus("reconnecting");
        es?.close();
        const delay = retryDelay.current;
        retryDelay.current = Math.min(delay * 2, 15000);
        retryTimer = setTimeout(connect, delay);
      };
    };

    refetch();
    connect();

    return () => {
      cancelled = true;
      es?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return { state, status };
}
