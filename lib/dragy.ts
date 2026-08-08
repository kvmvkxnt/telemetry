// Dragy Open API integration point — isolated & swappable.
//
// TODO(real Dragy integration): once registered at godragy.com/dragy-api and
// real credentials + endpoint docs are available, implement a
// `RealDragySessionProvider` against the documented spec and swap it in
// below via DRAGY_MODE=live. Do not guess at the API shape before then.

/** Units match what the admin form and display expect: metres, seconds, km/h.
 *  A real provider must convert if the Dragy API reports anything else. */
export type DragySession = {
  distance: number;
  elapsedTime: number;
  topSpeed: number;
  zeroToHundredTime: number | null;
  hundredToTwoHundredTime: number | null;
  raw: unknown;
};

export interface DragySessionProvider {
  /** Fetch the most recent session for a device/racer. Returns null if unavailable — callers must fall back to manual entry, never throw a blocking error. */
  getLatestSession(deviceId: string): Promise<DragySession | null>;
}

class StubDragySessionProvider implements DragySessionProvider {
  async getLatestSession(deviceId: string): Promise<DragySession | null> {
    // ponytail: fake data so admin UI + demo work with zero live Dragy access.
    await new Promise((r) => setTimeout(r, 300));
    const raw = {
      device_id: deviceId,
      mock: true,
      timestamp: new Date().toISOString(),
    };
    return {
      distance: 402,
      elapsedTime: 11.8 + Math.random() * 0.6,
      topSpeed: 210 + Math.random() * 40,
      zeroToHundredTime: 3.9 + Math.random() * 0.4,
      hundredToTwoHundredTime: 9.5 + Math.random() * 0.8,
      raw,
    };
  }
}

// DRAGY_MODE=live is reserved for the future RealDragySessionProvider.
// Anything else (including unset) uses the stub, so the app runs fully
// standalone with no live Dragy device required.
export const dragyProvider: DragySessionProvider = new StubDragySessionProvider();
