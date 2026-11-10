import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { rewardToGrant, type Reward } from '@/engine/scoring';

import { STATE_VERSION, migrateState } from './migrate';

// One logged answer. Mastery (Milestone 3) is computed from these, never invented.
export type Attempt = {
  questionId: string;
  concept: string;
  levelKey: string;
  correct: boolean;
  ms: number;
  at: number;
};

const MAX_ATTEMPTS = 2000;

// Everything the player owns. Saved on the device so guests keep progress.
// Later this same shape moves to the server when the player signs up.
type GameState = {
  guestId: string;
  hasStarted: boolean;
  displayName: string; // optional; guests show as "Guest"
  ageGroup: string | null;
  goal: string | null;
  dailyMinutes: number | null;
  xp: number;
  coins: number;
  streak: number;
  // levelStars["quant:1"] = 1..3 stars. Missing = not cleared.
  levelStars: Record<string, number>;
  // Best reward ever paid per level, so replays only pay for improvement.
  levelBest: Record<string, Reward>;
  attempts: Attempt[];
  signupPromptSeen: boolean;
  helpSeen: boolean; // the dismissible "how the journey works" note
  shuffleTipSeen: boolean; // the one-line tooltip pointing at the Shuffle button
  masteredGenres: string[];
  startGuest: () => void;
  setOnboarding: (age: string, goal: string, minutes: number) => void;
  setProfile: (p: { displayName: string; ageGroup: string | null; goal: string | null; dailyMinutes: number | null }) => void;
  logAttempt: (a: Attempt) => void;
  // Records a finished level. Returns what was actually granted (0 on a pure replay).
  completeLevel: (key: string, stars: number, attemptReward: Reward) => Reward;
  markSignupPromptSeen: () => void;
  markHelpSeen: () => void;
  markShuffleTipSeen: () => void;
  reset: () => void;
};

const newGuestId = () => 'guest_' + Math.random().toString(36).slice(2, 10);

const initial = {
  guestId: '',
  hasStarted: false,
  displayName: '',
  ageGroup: null,
  goal: null,
  dailyMinutes: null,
  xp: 0,
  coins: 0,
  streak: 0,
  levelStars: {},
  levelBest: {},
  attempts: [],
  signupPromptSeen: false,
  helpSeen: false,
  shuffleTipSeen: false,
  masteredGenres: [],
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initial,
      startGuest: () => {
        if (!get().guestId) set({ guestId: newGuestId() });
        set({ hasStarted: true });
      },
      setOnboarding: (ageGroup, goal, minutes) => set({ ageGroup, goal, dailyMinutes: minutes }),
      setProfile: (p) => set({ displayName: p.displayName.trim().slice(0, 24), ageGroup: p.ageGroup, goal: p.goal, dailyMinutes: p.dailyMinutes }),
      logAttempt: (a) => set((s) => ({ attempts: [...s.attempts, a].slice(-MAX_ATTEMPTS) })),
      completeLevel: (key, stars, attemptReward) => {
        const s = get();
        const granted = rewardToGrant(attemptReward, s.levelBest[key]);
        const prev = s.levelBest[key];
        set({
          xp: s.xp + granted.xp,
          coins: s.coins + granted.coins,
          levelStars: stars > 0 ? { ...s.levelStars, [key]: Math.max(stars, s.levelStars[key] ?? 0) } : s.levelStars,
          levelBest: {
            ...s.levelBest,
            [key]: { xp: Math.max(prev?.xp ?? 0, attemptReward.xp), coins: Math.max(prev?.coins ?? 0, attemptReward.coins) },
          },
        });
        return granted;
      },
      markSignupPromptSeen: () => set({ signupPromptSeen: true }),
      markHelpSeen: () => set({ helpSeen: true }),
      markShuffleTipSeen: () => set({ shuffleTipSeen: true }),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'summit-game',
      storage: createJSONStorage(() => AsyncStorage),
      version: STATE_VERSION,
      migrate: (persisted, version) => migrateState(persisted, version) as any,
    },
  ),
);

// A level is open if it is level 1 or the previous level has at least 1 star.
export const isLevelUnlocked = (stars: Record<string, number>, genre: string, n: number) =>
  n === 1 || (stars[`${genre}:${n - 1}`] ?? 0) > 0;

export const clearedLevelCount = (stars: Record<string, number>) => Object.keys(stars).length;
