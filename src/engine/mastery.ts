// Mastery is computed only from real logged answers. Nothing here invents data.
//
// For each skill ("concept") every answer gets a weight:
//   replay discount  0.25^(n-1) for the n-th time the SAME question was answered, so memorising a
//                    two-question level cannot inflate mastery
//   difficulty       easy 1.0, medium 1.25, hard 1.5
//   recency          halves every 14 days, so old practice fades toward "unknown"
// The score is a weighted accuracy shrunk toward 50% by one "virtual" answer, so a single lucky
// answer never reads as mastery. Speed is reported separately and does not change the score.

export type AttemptLike = { questionId: string; concept: string; levelKey: string; correct: boolean; ms: number; at: number };
export type QuestionMeta = Record<string, { difficulty: 1 | 2 | 3; expectedSeconds: number }>;

export const HALF_LIFE_DAYS = 14;
export const REPLAY_DISCOUNT = 0.25; // each repeat of the same question counts a quarter as much as the one before
export const PRIOR_WEIGHT = 1;
export const MIN_DISTINCT_QUESTIONS = 2; // below this we show "not enough data"
export const SOLID_DISTINCT_QUESTIONS = 4; // below this the number is an early estimate
export const DIFFICULTY_WEIGHT = { 1: 1, 2: 1.25, 3: 1.5 } as const;
const DAY_MS = 86_400_000;

export type Trend = 'up' | 'down' | 'flat' | null;

export type ConceptMastery = {
  concept: string;
  attempts: number; // every logged answer
  distinct: number; // different questions answered
  accuracy: number; // first-try accuracy over distinct questions, 0..1
  mastery: number | null; // 0..100, or null when there is not enough data
  confidence: 'none' | 'early' | 'solid';
  avgSeconds: number | null;
  speed: number | null; // average time / expected time (below 1 = faster than expected)
  lastAt: number;
  trend: Trend;
};

export function computeMastery(attempts: AttemptLike[], meta: QuestionMeta, now = Date.now()): ConceptMastery[] {
  const byConcept = new Map<string, AttemptLike[]>();
  for (const a of [...attempts].sort((x, y) => x.at - y.at)) {
    const list = byConcept.get(a.concept) ?? [];
    list.push(a);
    byConcept.set(a.concept, list);
  }

  const out: ConceptMastery[] = [];
  for (const [concept, list] of byConcept) {
    const seen = new Map<string, number>();
    let wSum = 0;
    let wCorrect = 0;
    let firstTryCorrect = 0;
    let expected = 0;
    let timed = 0;
    let totalMs = 0;
    for (const a of list) {
      const n = (seen.get(a.questionId) ?? 0) + 1;
      seen.set(a.questionId, n);
      const m = meta[a.questionId];
      const age = Math.max(0, now - a.at) / DAY_MS;
      const w = REPLAY_DISCOUNT ** (n - 1) * DIFFICULTY_WEIGHT[m?.difficulty ?? 2] * 0.5 ** (age / HALF_LIFE_DAYS);
      wSum += w;
      if (a.correct) wCorrect += w;
      if (n === 1 && a.correct) firstTryCorrect++;
      if (a.ms > 0) {
        totalMs += a.ms;
        timed++;
        expected += (m?.expectedSeconds ?? 60) * 1000;
      }
    }
    const distinct = seen.size;
    const enough = distinct >= MIN_DISTINCT_QUESTIONS;
    const score = (wCorrect + 0.5 * PRIOR_WEIGHT) / (wSum + PRIOR_WEIGHT);
    out.push({
      concept,
      attempts: list.length,
      distinct,
      accuracy: distinct ? firstTryCorrect / distinct : 0,
      mastery: enough ? Math.round(score * 100) : null,
      confidence: !enough ? 'none' : distinct >= SOLID_DISTINCT_QUESTIONS ? 'solid' : 'early',
      avgSeconds: timed ? Math.round(totalMs / timed / 100) / 10 : null,
      speed: timed && expected ? totalMs / expected : null,
      lastAt: list[list.length - 1].at,
      trend: trendOf(list),
    });
  }
  return out;
}

// Needs at least 6 answers: compares the latest 3 with the 3 before them.
function trendOf(list: AttemptLike[]): Trend {
  if (list.length < 6) return null;
  const rate = (xs: AttemptLike[]) => xs.filter((a) => a.correct).length / xs.length;
  const d = rate(list.slice(-3)) - rate(list.slice(-6, -3));
  return d > 0.2 ? 'up' : d < -0.2 ? 'down' : 'flat';
}

export const genreOf = (concept: string) => concept.split(':')[0];

// Average of the skills that have enough data (each counts equally), or null.
export function genreMastery(list: ConceptMastery[], genre: string): number | null {
  const m = list.filter((c) => genreOf(c.concept) === genre && c.mastery !== null);
  return m.length ? Math.round(m.reduce((s, c) => s + (c.mastery as number), 0) / m.length) : null;
}

export const WEAK_BELOW = 75;

export function weakest(list: ConceptMastery[], n = 3): ConceptMastery[] {
  return list.filter((c) => c.mastery !== null && c.mastery < WEAK_BELOW).sort((a, b) => (a.mastery as number) - (b.mastery as number) || a.lastAt - b.lastAt).slice(0, n);
}

export function strongest(list: ConceptMastery[], n = 3): ConceptMastery[] {
  return list.filter((c) => c.mastery !== null && c.mastery >= WEAK_BELOW).sort((a, b) => (b.mastery as number) - (a.mastery as number)).slice(0, n);
}
