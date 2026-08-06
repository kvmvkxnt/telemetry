import { describe, expect, it } from "vitest";
import { determineWinner } from "./winner";

describe("determineWinner", () => {
  it("picks the lower elapsed_time as winner", () => {
    const winner = determineWinner(
      [
        { racer_id: 1, elapsed_time: 12.5, top_speed: 100 },
        { racer_id: 2, elapsed_time: 11.9, top_speed: 95 },
      ],
      "elapsed_time"
    );
    expect(winner).toBe(2);
  });

  it("picks the higher top_speed as winner", () => {
    const winner = determineWinner(
      [
        { racer_id: 1, elapsed_time: 12.5, top_speed: 100 },
        { racer_id: 2, elapsed_time: 11.9, top_speed: 95 },
      ],
      "top_speed"
    );
    expect(winner).toBe(1);
  });

  it("ignores racers missing the active metric", () => {
    const winner = determineWinner(
      [
        { racer_id: 1, elapsed_time: null, top_speed: 100 },
        { racer_id: 2, elapsed_time: 11.9, top_speed: 95 },
      ],
      "elapsed_time"
    );
    expect(winner).toBe(2);
  });

  it("returns null when nobody has the active metric", () => {
    const winner = determineWinner([{ racer_id: 1, elapsed_time: null, top_speed: null }], "elapsed_time");
    expect(winner).toBeNull();
  });

  it("returns null for an empty result set", () => {
    expect(determineWinner([], "elapsed_time")).toBeNull();
  });
});
