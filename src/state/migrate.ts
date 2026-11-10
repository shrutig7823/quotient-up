// Versioned migration of saved game state. Pure, so it can be tested without React Native.
//   v1: 10 hand-written Quant levels, progress keyed "quant:1".."quant:10"
//   v2: 20 authored levels per genre from the question bank (content version 1)
// The ids "quant:1".. now point at DIFFERENT questions, so v1 progress must not be reassigned.
// We keep it (untouched) under `legacyProgress` and start the new levels clean. XP and coins stay.
export const STATE_VERSION = 2;

export function migrateState(persisted: any, fromVersion: number) {
  if (!persisted || typeof persisted !== 'object') return persisted;
  let s = { ...persisted };
  if (fromVersion < 2) {
    s = {
      ...s,
      legacyProgress: { levelStars: s.levelStars ?? {}, levelBest: s.levelBest ?? {}, fromVersion },
      levelStars: {},
      levelBest: {},
    };
  }
  return s;
}
