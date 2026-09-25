const DAY_MS = 24 * 60 * 60 * 1000;

let offsetMs = 0;

/** Relógio que o `@/lib/clock` usa na suíte. */
export function testNow(): Date {
  return new Date(Date.now() + offsetMs);
}

export function advanceClock(ms: number) {
  offsetMs += ms;
}

export function advanceDays(days: number) {
  advanceClock(days * DAY_MS);
}

export function resetClock() {
  offsetMs = 0;
}
