import { describe, expect, it } from "vitest";
import { determineWinner } from "./winner";

describe("determineWinner", () => {
  it("picks the lower elapsed_time as winner", () => {
    const winner = determineWinner(
      [
        { racer_id: 1, elapsed_time: 12.5, zero_to_60_time: null, zero_to_100_time: null },
        { racer_id: 2, elapsed_time: 11.9, zero_to_60_time: null, zero_to_100_time: null },
      ],
      "elapsed_time"
    );
    expect(winner).toBe(2);
  });

  it("picks the lower zero_to_60_time as winner", () => {
    const winner = determineWinner(
      [
        { racer_id: 1, elapsed_time: 12.5, zero_to_60_time: 4.1, zero_to_100_time: null },
        { racer_id: 2, elapsed_time: 11.9, zero_to_60_time: 3.8, zero_to_100_time: null },
      ],
      "zero_to_60_time"
    );
    expect(winner).toBe(2);
  });

  it("ignores racers missing the active metric", () => {
    const winner = determineWinner(
      [
        { racer_id: 1, elapsed_time: null, zero_to_60_time: null, zero_to_100_time: null },
        { racer_id: 2, elapsed_time: 11.9, zero_to_60_time: null, zero_to_100_time: null },
      ],
      "elapsed_time"
    );
    expect(winner).toBe(2);
  });

  it("returns null when nobody has the active metric", () => {
    const winner = determineWinner([{ racer_id: 1, elapsed_time: null, zero_to_60_time: null, zero_to_100_time: null }], "elapsed_time");
    expect(winner).toBeNull();
  });

  it("returns null for an empty result set", () => {
    expect(determineWinner([], "elapsed_time")).toBeNull();
  });
});
