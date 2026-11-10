import { type AttemptLike, type QuestionMeta, computeMastery } from './mastery';

// Questions the player got wrong, and what happened when they tried again. Pure functions.
// A retry question has an id like "RTY-<original id>-v2"; every retry belongs to the ORIGINAL it came from.
export const isRetryId = (id: string) => id.startsWith('RTY-');
export const rootOf = (id: string) => (isRetryId(id) ? id.slice(4, id.lastIndexOf('-v')) : id);

export type Family = {
  root: string; // the original question's id
  attempts: AttemptLike[]; // the original and all its retries, oldest first
  status: 'open' | 'recovered'; // recovered = it was missed, and the latest try was right
  retries: number; // new versions attempted so far
  lastAt: number;
};

// Every original question that was missed at least once, with whether it has been recovered.
export function missedFamilies(attempts: AttemptLike[]): Family[] {
  const by = new Map<string, AttemptLike[]>();
  for (const a of [...attempts].sort((x, y) => x.at - y.at)) {
    const r = rootOf(a.questionId);
    by.set(r, [...(by.get(r) ?? []), a]);
  }
  const out: Family[] = [];
  for (const [root, list] of by) {
    if (!list.some((a) => !a.correct)) continue; // never missed: nothing to retry
    const last = list[list.length - 1];
    out.push({
      root, attempts: list, status: last.correct ? 'recovered' : 'open',
      retries: new Set(list.filter((a) => isRetryId(a.questionId)).map((a) => a.questionId)).size, lastAt: last.at,
    });
  }
  return out.sort((a, b) => b.lastAt - a.lastAt);
}

// Which new version to serve next for a missed question: one the player has not seen yet.
export const nextVariant = (attempts: AttemptLike[], root: string) =>
  new Set(attempts.filter((a) => isRetryId(a.questionId) && rootOf(a.questionId) === root).map((a) => a.questionId)).size + 1;

export type Improvement = { concept: string; from: number; to: number; delta: number };

// Skills that have got better: mastery now versus when the skill FIRST had enough answers to be estimated.
// Only changes of MIN_GAIN points or more count, so wobble is not reported as progress.
export const MIN_GAIN = 5;
export function improvements(attempts: AttemptLike[], meta: QuestionMeta, now = Date.now()): Improvement[] {
  const nowList = computeMastery(attempts, meta, now);
  const out: Improvement[] = [];
  for (const c of nowList) {
    if (c.mastery === null) continue;
    const mine = attempts.filter((a) => a.concept === c.concept).sort((x, y) => x.at - y.at);
    // earliest moment two different questions had been answered
    const seen = new Set<string>();
    let t0 = -1;
    for (const a of mine) {
      seen.add(a.questionId);
      if (seen.size >= 2) { t0 = a.at; break; }
    }
    if (t0 < 0) continue;
    const first = computeMastery(mine.filter((a) => a.at <= t0), meta, t0)[0];
    if (!first || first.mastery === null) continue;
    const delta = c.mastery - first.mastery;
    if (delta >= MIN_GAIN) out.push({ concept: c.concept, from: first.mastery, to: c.mastery, delta });
  }
  return out.sort((a, b) => b.delta - a.delta);
}

// Accuracy of the last `n` answers versus the `n` before them (null until there are 2n answers).
export function recentTrend(attempts: AttemptLike[], n = 10): { recent: number; before: number; delta: number } | null {
  const list = [...attempts].sort((a, b) => a.at - b.at);
  if (list.length < 2 * n) return null;
  const rate = (xs: AttemptLike[]) => Math.round((xs.filter((a) => a.correct).length / xs.length) * 100);
  const recent = rate(list.slice(-n));
  const before = rate(list.slice(-2 * n, -n));
  return { recent, before, delta: recent - before };
}
