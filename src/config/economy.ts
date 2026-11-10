// Game rules in one place (no magic numbers in screens).
export const SIGNUP_PROMPT_AFTER_LEVELS = 5; // "Save your progress?" appears after this many cleared levels
export const SURVIVAL_LIVES = 3; // lives apply to Survival Rooms only; normal levels are unlimited
export const LIFE_REFILL_HOURS = 5;
// Summit opens only when every genre has BOTH its levels completed AND its Mastery Trial passed.

// Stars: 1 = at least half right, 2 = at least 75% right, 3 = all right AND within the expected time.
export const ONE_STAR_ACCURACY = 0.5;
export const TWO_STAR_ACCURACY = 0.75;

// Rewards (virtual only).
export const XP_PER_CORRECT = 25;
export const XP_PER_STAR = 10;
export const COINS_PER_CORRECT = 10;
export const COINS_PER_STAR = 5;
