import { EventEmitter } from "node:events";

// ponytail: single in-process bus. Fine since this app is one Node process
// per venue (see README topology). No pub/sub broker needed for that scale.
export const bus = new EventEmitter();
bus.setMaxListeners(100);

export type BusEvent = { type: "state_changed" };

export function publish() {
  bus.emit("state_changed", { type: "state_changed" } satisfies BusEvent);
}
