import {
  COINS_PER_CORRECT, COINS_PER_STAR, ONE_STAR_ACCURACY, TWO_STAR_ACCURACY, XP_PER_CORRECT, XP_PER_STAR,
} from '../config/economy';

export type Reward = { xp: number; coins: number };

export function computeStars(correct: number, total: number, seconds: number, expectedSeconds: number): 0 | 1 | 2 | 3 {
  if (total === 0) return 0;
  const accuracy = correct / total;
  if (accuracy < ONE_STAR_ACCURACY) return 0;
  if (accuracy === 1 && seconds <= expectedSeconds) return 3;
  if (accuracy >= TWO_STAR_ACCURACY) return 2;
  return 1;
}

export function rewardFor(correct: number, stars: number): Reward {
  return {
    xp: correct * XP_PER_CORRECT + stars * XP_PER_STAR,
    coins: correct * COINS_PER_CORRECT + stars * COINS_PER_STAR,
  };
}

// Replays only pay the improvement over your best run, so repeating a level can't farm coins.
export function rewardToGrant(attempt: Reward, bestSoFar: Reward | undefined): Reward {
  return {
    xp: Math.max(0, attempt.xp - (bestSoFar?.xp ?? 0)),
    coins: Math.max(0, attempt.coins - (bestSoFar?.coins ?? 0)),
  };
}
