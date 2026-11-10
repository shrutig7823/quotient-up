import type { AttemptLike, QuestionMeta } from '../engine/mastery';
import { isRetryId, nextVariant, rootOf } from '../engine/progress';
import type { Level, Question } from '../questions/types';
import { displayAnswer } from '../questions/validate';
import { LEVELS } from './bank';
import { variantOf } from './gen';

// One index over EVERY question in the game (authored + generated), keyed by id.
export type Entry = {
  id: string; genreId: string; primarySkill: string; prompt: string; answer: string; explanation: string;
  difficulty: 1 | 2 | 3; expectedSeconds: number; concept: string;
};
const promptOf = (q: Question) => ('prompt' in q ? q.prompt : '');

export const QUESTION_BY_ID: Record<string, Question> = {};
export const RECORDS_BY_ID: Record<string, Entry> = {};
const LABELS: Record<string, string> = {};
for (const [genre, levels] of Object.entries(LEVELS)) {
  for (const l of levels) {
    for (const q of l.questions) {
      QUESTION_BY_ID[q.id] = q;
      const skill = q.skill ?? q.concept.split(':')[1];
      LABELS[q.concept] = skill;
      RECORDS_BY_ID[q.id] = {
        id: q.id, genreId: genre, primarySkill: skill, prompt: promptOf(q), answer: displayAnswer(q), explanation: q.explanation,
        difficulty: q.difficulty, expectedSeconds: q.expectedSeconds, concept: q.concept,
      };
    }
  }
}

export const conceptLabel = (concept: string) => LABELS[concept] ?? concept.split(':')[1] ?? concept;

// Answers logged against content that no longer exists (for example the old 10-level Quant set)
// are kept in storage but ignored by mastery, so they cannot distort it.
export const currentAttempts = <A extends { concept: string }>(attempts: A[]): A[] => attempts.filter((a) => a.concept in LABELS);

// "quant-practice-percentage-changes" opens like any level.
export const practiceId = (concept: string) => {
  const [genre, skill] = concept.split(':');
  return `${genre}-practice-${skill}`;
};

// A short set from the same skill. Questions you got wrong come first, then unseen ones, then the rest.
export function buildPractice(genre: string, skill: string, attempts: AttemptLike[], size = 3): Level | undefined {
  const concept = `${genre}:${skill}`;
  const pool = Object.values(QUESTION_BY_ID).filter((q) => q.concept === concept);
  if (!pool.length) return undefined;
  const wrong = new Set(attempts.filter((a) => !a.correct).map((a) => a.questionId));
  const seen = new Set(attempts.map((a) => a.questionId));
  const rank = (id: string) => (wrong.has(id) ? 0 : seen.has(id) ? 2 : 1);
  const chosen = [...pool].sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id)).slice(0, size);
  return { id: practiceId(concept), genre, n: 0, title: `Quick Fix: ${conceptLabel(concept)}`, stage: 'easy', questions: chosen };
}

export const QUESTION_META: QuestionMeta = Object.fromEntries(
  Object.values(RECORDS_BY_ID).map((e) => [e.id, { difficulty: e.difficulty, expectedSeconds: e.expectedSeconds }]),
);
export { LEVELS };

// ---- Retrying missed questions ----------------------------------------------------------------
// A retry question's id says exactly how to rebuild it ("RTY-<original>-v<n>"), so it never needs storing.
const rebuilt = new Map<string, Question | undefined>();
export function resolveQuestion(id: string): Question | undefined {
  if (QUESTION_BY_ID[id]) return QUESTION_BY_ID[id];
  if (!isRetryId(id)) return undefined;
  if (!rebuilt.has(id)) {
    const m = id.match(/^RTY-(.+)-v(\d+)$/);
    const orig = m ? QUESTION_BY_ID[m[1]] : undefined;
    rebuilt.set(id, orig ? variantOf(orig, Number(m![2])) : undefined);
  }
  return rebuilt.get(id);
}

// Prompt, answer and explanation for any question id, original or retry.
export function entryFor(id: string): Entry | undefined {
  if (RECORDS_BY_ID[id]) return RECORDS_BY_ID[id];
  const q = resolveQuestion(id);
  if (!q) return undefined;
  const root = QUESTION_BY_ID[rootOf(id)];
  return {
    id, genreId: q.concept.split(':')[0], primarySkill: q.skill ?? conceptLabel(q.concept), prompt: promptOf(q), answer: displayAnswer(q),
    explanation: q.explanation, difficulty: q.difficulty, expectedSeconds: q.expectedSeconds, concept: root?.concept ?? q.concept,
  };
}

// Mastery needs difficulty and expected time for every answered id, retries included.
export function metaFor(attempts: { questionId: string }[]): QuestionMeta {
  const meta: QuestionMeta = { ...QUESTION_META };
  for (const a of attempts) {
    if (!meta[a.questionId]) {
      const q = resolveQuestion(a.questionId);
      if (q) meta[a.questionId] = { difficulty: q.difficulty, expectedSeconds: q.expectedSeconds };
    }
  }
  return meta;
}

// "Try again" for one missed question: a new version in the same style, different numbers or set-up.
export function buildRetry(root: string, attempts: AttemptLike[]): Level | undefined {
  const orig = QUESTION_BY_ID[root];
  if (!orig) return undefined;
  const q = variantOf(orig, nextVariant(attempts, root));
  if (!q) return undefined;
  const genre = orig.concept.split(':')[0];
  return { id: `${genre}-retry-${root}`, genre, n: 0, title: `Try again: ${orig.skill ?? conceptLabel(orig.concept)}`, stage: 'easy', questions: [q] };
}
