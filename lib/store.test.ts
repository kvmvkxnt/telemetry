import { describe, expect, it } from "vitest";
import { createRace, createRacer, getPublicState, startRace, submitResults } from "./store";

describe("store", () => {
  it("overwrites a race's result on resubmission (admin correction flow)", () => {
    const a = createRacer("Alice", "Supra", null);
    const b = createRacer("Bob", "GT-R", null);
    const race = createRace(a.id, b.id);
    startRace(race.id);

    submitResults(race.id, [
      { racerId: a.id, distance: 402, elapsedTime: 12.0, topSpeed: 110, zeroToHundredTime: null, hundredToTwoHundredTime: null },
      { racerId: b.id, distance: 402, elapsedTime: 11.5, topSpeed: 108, zeroToHundredTime: null, hundredToTwoHundredTime: null },
    ]);

    let state = getPublicState();
    let completed = state.leaderboard.find((r) => r.id === race.id)!;
    expect(completed.winnerRacerId).toBe(b.id);

    // Correction: Alice's time was actually faster — resubmit, must overwrite not duplicate.
    submitResults(race.id, [
      { racerId: a.id, distance: 402, elapsedTime: 11.0, topSpeed: 112, zeroToHundredTime: null, hundredToTwoHundredTime: null },
      { racerId: b.id, distance: 402, elapsedTime: 11.5, topSpeed: 108, zeroToHundredTime: null, hundredToTwoHundredTime: null },
    ]);

    state = getPublicState();
    completed = state.leaderboard.find((r) => r.id === race.id)!;
    expect(completed.results).toHaveLength(2);
    expect(completed.winnerRacerId).toBe(a.id);
  });

  it("rejects negative values", () => {
    const a = createRacer("Carl", null, null);
    const race = createRace(a.id, null);
    expect(() =>
      submitResults(race.id, [
        { racerId: a.id, distance: -1, elapsedTime: 12, topSpeed: 100, zeroToHundredTime: null, hundredToTwoHundredTime: null },
      ])
    ).toThrow();
  });
});
