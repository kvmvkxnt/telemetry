import { describe, expect, it } from "vitest";
import { createRace, createRacer, getPublicState, launchRace, stageRace, submitResults } from "./store";

describe("store", () => {
  it("overwrites a race's result on resubmission (admin correction flow)", () => {
    const a = createRacer("Toyota", "Supra", null);
    const b = createRacer("Nissan", "GT-R", null);
    const race = createRace(a.id, b.id);
    stageRace(race.id);
    launchRace(race.id);

    submitResults(race.id, [
      { racerId: a.id, distance: 402, elapsedTime: 12.0, topSpeed: 110, zeroToHundredTime: null, hundredToTwoHundredTime: null },
      { racerId: b.id, distance: 402, elapsedTime: 11.5, topSpeed: 108, zeroToHundredTime: null, hundredToTwoHundredTime: null },
    ]);

    let state = getPublicState();
    let completed = state.leaderboard.find((r) => r.id === race.id)!;
    expect(completed.winnerRacerId).toBe(b.id);

    // Correction: Toyota's time was actually faster — resubmit, must overwrite not duplicate.
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
    const a = createRacer("Honda", "Civic", null);
    const race = createRace(a.id, null);
    expect(() =>
      submitResults(race.id, [
        { racerId: a.id, distance: -1, elapsedTime: 12, topSpeed: 100, zeroToHundredTime: null, hundredToTwoHundredTime: null },
      ])
    ).toThrow();
  });

  it("only one race can be staging/racing at a time", () => {
    const a = createRacer("Ford", "Mustang", null);
    const b = createRacer("Chevrolet", "Camaro", null);
    const race1 = createRace(a.id, null);
    const race2 = createRace(b.id, null);

    stageRace(race1.id);
    stageRace(race2.id);

    const state = getPublicState();
    expect(state.currentRace?.id).toBe(race2.id);
    expect(state.upcoming.map((r) => r.id)).toContain(race1.id);
  });
});
