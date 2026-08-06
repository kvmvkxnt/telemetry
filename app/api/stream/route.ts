import { bus } from "@/lib/bus";

export const dynamic = "force-dynamic";

// SSE endpoint: pushes a "changed" ping whenever state mutates, plus a
// heartbeat every 15s to detect dead connections quickly. Clients react by
// re-fetching /api/state in full — no diffing, so a missed or duplicate
// event can never leave the display showing partial/stale data.
export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: string) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        } catch {
          cleanup();
        }
      };

      send("changed", "init");

      const onChange = () => send("changed", Date.now().toString());
      bus.on("state_changed", onChange);

      const heartbeat = setInterval(() => send("heartbeat", Date.now().toString()), 15000);

      function cleanup() {
        clearInterval(heartbeat);
        bus.off("state_changed", onChange);
        try {
          controller.close();
        } catch {
          // already closed
        }
      }

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
