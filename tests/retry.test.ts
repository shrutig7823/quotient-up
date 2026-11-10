import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GENRE_IDS, LEVELS } from '../src/content/bank';
import { variantOf } from '../src/content/gen';
import { QUESTION_BY_ID, buildRetry, entryFor, metaFor, resolveQuestion } from '../src/content/practice';
import type { AttemptLike } from '../src/engine/mastery';
import { improvements, isRetryId, missedFamilies, nextVariant, recentTrend, rootOf } from '../src/engine/progress';
import { correctAnswerOf, validate } from '../src/questions/validate';

const all = GENRE_IDS.flatMap((g) => LEVELS[g].flatMap((l) => l.questions));
const promptOf = (q: any) => ('prompt' in q ? q.prompt : '');

test('every question can produce new versions: different, valid, correctly answerable, same skill', () => {
  const problems: string[] = [];
  for (const q of all) {
    for (let n = 1; n <= 3; n++) {
      const v = variantOf(q, n);
      if (!v) { problems.push(`${q.id} v${n}: none`); continue; }
      if (v.concept !== q.concept) problems.push(`${q.id} v${n}: concept changed`);
      if (promptOf(v) === promptOf(q)) problems.push(`${q.id} v${n}: same prompt as the original`);
      if (!validate(v, correctAnswerOf(v) as any)) problems.push(`${q.id} v${n}: its own answer is rejected`);
      if (v.type === 'choice' && (v.choices.length !== 4 || new Set(v.choices.map((c) => c.label)).size !== 4)) problems.push(`${q.id} v${n}: bad options`);
      if (!v.explanation) problems.push(`${q.id} v${n}: no explanation`);
    }
  }
  assert.deepEqual(problems.slice(0, 10), [], `${problems.length} problems over ${all.length * 3} versions`);
});

test('versions are deterministic and differ from each other', () => {
  const q = all[10];
  assert.deepEqual(variantOf(q, 1), variantOf(q, 1));
  const prompts = [1, 2, 3, 4].map((n) => promptOf(variantOf(q, n)));
  assert.ok(new Set(prompts).size >= 3, 'most versions should differ');
});

test('a typed-number original gets a typed-number version when the answer is a plain number', () => {
  const typed = all.filter((q) => q.type === 'entry' && q.format === 'numeric');
  assert.ok(typed.length > 50);
  const converted = typed.filter((q) => variantOf(q, 1)?.type === 'entry').length;
  assert.ok(converted > 10, `only ${converted} of ${typed.length} stayed typed`);
});

test('retry ids can always be rebuilt from the id alone', () => {
  const q = all[0];
  const v = variantOf(q, 2)!;
  assert.equal(isRetryId(v.id), true);
  assert.equal(rootOf(v.id), q.id);
  assert.deepEqual(resolveQuestion(v.id), v);
  assert.ok(entryFor(v.id)?.answer);
  const meta = metaFor([{ questionId: v.id }]);
  assert.ok(meta[v.id].expectedSeconds > 0);
  assert.equal(QUESTION_BY_ID[q.id], q);
});

const at = (questionId: string, correct: boolean, t: number, concept = 'quant:percentages'): AttemptLike => ({ questionId, concept, levelKey: 'k', correct, ms: 20000, at: t });
const DAY = 86_400_000;

test('missed questions: open until the latest try is right', () => {
  const a = [at('QUA-001', false, 1), at('QUA-002', true, 2), at('RTY-QUA-001-v1', false, 3), at('QUA-003', false, 4), at('RTY-QUA-003-v1', true, 5)];
  const fam = missedFamilies(a);
  assert.deepEqual(fam.map((f) => [f.root, f.status, f.retries]).sort(), [['QUA-001', 'open', 1], ['QUA-003', 'recovered', 1]]);
  assert.equal(nextVariant(a, 'QUA-001'), 2);
  assert.equal(nextVariant(a, 'QUA-002'), 1);
  assert.equal(missedFamilies([at('QUA-002', true, 1)]).length, 0); // never missed: nothing to retry
});

test('retry builds a one-question level in the same world', () => {
  const lvl = buildRetry('QUA-014', [])!;
  assert.equal(lvl.n, 0);
  assert.equal(lvl.genre, 'quant');
  assert.equal(lvl.questions.length, 1);
  assert.equal(lvl.id, 'quant-retry-QUA-014');
  assert.equal(buildRetry('NOPE-1', []), undefined);
});

test('improvement: reported only when mastery rose by 5+ points since the skill was first estimated', () => {
  const meta = { a: { difficulty: 1 as const, expectedSeconds: 30 }, b: { difficulty: 1 as const, expectedSeconds: 30 }, c: { difficulty: 1 as const, expectedSeconds: 30 }, d: { difficulty: 1 as const, expectedSeconds: 30 } };
  const now = 100 * DAY;
  const better = [at('a', false, now - 10 * DAY), at('b', false, now - 9 * DAY), at('c', true, now - 1000), at('d', true, now - 500)];
  const imp = improvements(better, meta, now);
  assert.equal(imp.length, 1);
  assert.ok(imp[0].delta >= 5 && imp[0].to > imp[0].from);
  const worse = [at('a', true, now - 10 * DAY), at('b', true, now - 9 * DAY), at('c', false, now - 1000), at('d', false, now - 500)];
  assert.equal(improvements(worse, meta, now).length, 0);
  assert.equal(improvements([at('a', true, now)], meta, now).length, 0); // too little data to compare
});

test('recent trend compares the last 10 answers with the 10 before', () => {
  assert.equal(recentTrend(Array.from({ length: 12 }, (_, i) => at('a', true, i))), null);
  const list = [...Array.from({ length: 10 }, (_, i) => at('a', i < 3, i)), ...Array.from({ length: 10 }, (_, i) => at('b', i < 8, 10 + i))];
  assert.deepEqual(recentTrend(list), { recent: 80, before: 30, delta: 50 });
});
