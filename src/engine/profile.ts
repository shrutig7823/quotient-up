// Profile helpers. Pure, so they are easy to test.
export type ProfileFields = { displayName?: string | null; ageGroup?: string | null; goal?: string | null; dailyMinutes?: number | null };

// The four things a profile can have. Completion is simply how many are filled in.
export const PROFILE_FIELDS = ['displayName', 'ageGroup', 'goal', 'dailyMinutes'] as const;

export function profileCompletion(p: ProfileFields): number {
  const filled = [!!p.displayName?.trim(), !!p.ageGroup, !!p.goal, !!p.dailyMinutes].filter(Boolean).length;
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

export const initialOf = (name?: string | null) => (name?.trim()?.[0] ?? 'G').toUpperCase();

// Accuracy over every logged answer (null when there are none, so we never show a made-up number).
export function overallAccuracy(attempts: { correct: boolean }[]): number | null {
  return attempts.length ? Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100) : null;
}
