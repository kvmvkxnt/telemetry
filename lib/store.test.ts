import { describe, expect, it } from "vitest";
import {
  clearRaceResults,
  createRace,
  createRacer,
  deleteRace,
  deleteRacer,
  finishRun,
  getPublicState,
  getResultsForRace,
  launchRace,
  resetEvent,
  setLanguage,
  stageRace,
  submitResults,
} from "./store";

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

  it("deleting a race takes its results with it", () => {
    const a = createRacer("Mazda", "RX-7", null);
    const race = createRace(a.id, null);
    submitResults(race.id, [
      { racerId: a.id, distance: 402, elapsedTime: 12, topSpeed: 100, zeroToHundredTime: null, hundredToTwoHundredTime: null },
    ]);
    expect(getResultsForRace(race.id)).toHaveLength(1);

    deleteRace(race.id);

    expect(getResultsForRace(race.id)).toHaveLength(0);
    expect(getPublicState().leaderboard.some((r) => r.id === race.id)).toBe(false);
  });

  it("clearing results returns the race to the running order", () => {
    const a = createRacer("Subaru", "WRX", null);
    const race = createRace(a.id, null);
    submitResults(race.id, [
      { racerId: a.id, distance: 402, elapsedTime: 12, topSpeed: 100, zeroToHundredTime: null, hundredToTwoHundredTime: null },
    ]);

    clearRaceResults(race.id);

    const state = getPublicState();
    expect(getResultsForRace(race.id)).toHaveLength(0);
    expect(state.upcoming.map((r) => r.id)).toContain(race.id);
    expect(state.leaderboard.map((r) => r.id)).not.toContain(race.id);
  });

  it("refuses to delete a vehicle that is still entered in a race", () => {
    const a = createRacer("Porsche", "911", null);
    const race = createRace(a.id, null);

    expect(() => deleteRacer(a.id)).toThrow(/race/i);

    deleteRace(race.id);
    deleteRacer(a.id);
    expect(getPublicState().racers.some((r) => r.id === a.id)).toBe(false);
  });

  it("reset scopes clear the right amount", () => {
    resetEvent("all");
    const a = createRacer("Audi", "RS6", null);
    const race = createRace(a.id, null);
    submitResults(race.id, [
      { racerId: a.id, distance: 402, elapsedTime: 12, topSpeed: 100, zeroToHundredTime: null, hundredToTwoHundredTime: null },
    ]);

    resetEvent("results");
    let state = getPublicState();
    expect(state.leaderboard).toHaveLength(0);
    expect(state.upcoming).toHaveLength(1);
    expect(state.racers).toHaveLength(1);

    resetEvent("races");
    state = getPublicState();
    expect(state.upcoming).toHaveLength(0);
    expect(state.racers).toHaveLength(1);

    resetEvent("all");
    state = getPublicState();
    expect(state.racers).toHaveLength(0);
  });

  it("a finished run waits on results before it is scored", () => {
    resetEvent("all");
    const a = createRacer("BMW", "M3", null);
    const race = createRace(a.id, null);
    stageRace(race.id);
    launchRace(race.id);
    finishRun(race.id);

    let state = getPublicState();
    expect(state.currentRace?.status).toBe("awaiting_results");
    expect(state.awaitingResults.map((r) => r.id)).toContain(race.id);
    expect(state.leaderboard).toHaveLength(0);

    submitResults(race.id, [
      { racerId: a.id, distance: 402, elapsedTime: 11, topSpeed: 120, zeroToHundredTime: null, hundredToTwoHundredTime: null },
    ]);

    state = getPublicState();
    expect(state.awaitingResults).toHaveLength(0);
    expect(state.leaderboard.map((r) => r.id)).toContain(race.id);
  });

  it("a new race takes the screen but does not discard one awaiting results", () => {
    resetEvent("all");
    const a = createRacer("Honda", "NSX", null);
    const b = createRacer("Lexus", "LFA", null);
    const first = createRace(a.id, null);
    const second = createRace(b.id, null);

    stageRace(first.id);
    launchRace(first.id);
    finishRun(first.id);
    stageRace(second.id);

    const state = getPublicState();
    expect(state.currentRace?.id).toBe(second.id);
    // The first race keeps its status so its times can still be entered.
    expect(state.awaitingResults.map((r) => r.id)).toContain(first.id);
  });

  it("rejects an unsupported language", () => {
    expect(() => setLanguage("de")).toThrow();
    setLanguage("uz");
    expect(getPublicState().event.language).toBe("uz");
    setLanguage("en");
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
