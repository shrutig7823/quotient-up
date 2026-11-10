import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildPractice, conceptLabel, currentAttempts, practiceId, QUESTION_META } from '../src/content/practice';
import { computeMastery, genreMastery, strongest, weakest, type AttemptLike } from '../src/engine/mastery';

const NOW = Date.UTC(2026, 10, 7);
const meta = { a: { difficulty: 1 as const, expectedSeconds: 30 }, b: { difficulty: 1 as const, expectedSeconds: 30 }, c: { difficulty: 3 as const, expectedSeconds: 60 } };
const att = (questionId: string, correct: boolean, daysAgo = 0, concept = 'quant:percentages', ms = 20_000): AttemptLike => ({
  questionId, concept, levelKey: 'quant:1', correct, ms, at: NOW - daysAgo * 86_400_000,
});
const one = (list: AttemptLike[]) => computeMastery(list, meta, NOW)[0];

test('no answers means no mastery rows (nothing is invented)', () => {
  assert.deepEqual(computeMastery([], meta, NOW), []);
});

test('one question is not enough data: no percentage is shown', () => {
  const m = one([att('a', true)]);
  assert.equal(m.mastery, null);
  assert.equal(m.confidence, 'none');
});

test('two different questions give an early estimate; right beats wrong', () => {
  const right = one([att('a', true), att('b', true)]);
  const wrong = one([att('a', false), att('b', false)]);
  assert.equal(right.confidence, 'early');
  assert.ok((right.mastery as number) > 75 && (right.mastery as number) < 100); // never a perfect 100 from 2 answers
  assert.ok((wrong.mastery as number) < 25);
});

test('replaying the same question does not inflate mastery', () => {
  const base = one([att('a', true), att('b', false)]).mastery as number;
  const farmed = one([att('a', true), att('b', false), att('a', true), att('a', true), att('a', true), att('a', true)]).mastery as number;
  assert.ok(farmed - base < 12, `base ${base}, after replaying a correct item 4 times ${farmed}`);
});

test('harder questions count more', () => {
  const hardRight = one([att('c', true), att('a', false)]).mastery as number;
  const easyRight = one([att('a', true), att('b', false)]).mastery as number;
  assert.ok(hardRight > easyRight);
});

test('old practice fades toward unknown', () => {
  const fresh = one([att('a', true, 0), att('b', true, 0)]).mastery as number;
  const old = one([att('a', true, 60), att('b', true, 60)]).mastery as number;
  assert.ok(old < fresh && old > 50);
});

test('first-try accuracy and speed are reported separately', () => {
  const m = one([att('a', true, 0, 'quant:percentages', 15_000), att('b', false, 0, 'quant:percentages', 15_000)]);
  assert.equal(m.accuracy, 0.5);
  assert.equal(m.speed, 0.5); // 15s taken vs 30s expected
  assert.equal(m.avgSeconds, 15);
});

test('trend needs six answers, then compares latest three with the three before', () => {
  assert.equal(one([att('a', true), att('b', true)]).trend, null);
  const up = [false, false, false, true, true, true].map((c, i) => att('a', c, 6 - i));
  assert.equal(one(up).trend, 'up');
  const down = [true, true, true, false, false, false].map((c, i) => att('a', c, 6 - i));
  assert.equal(one(down).trend, 'down');
});

test('weakest / strongest / genre roll-up use only skills with enough data', () => {
  const list = computeMastery(
    [att('a', true), att('b', true), att('a', false, 0, 'logic:series'), att('b', false, 0, 'logic:series'), att('a', true, 0, 'data:tables')],
    meta,
    NOW,
  );
  assert.deepEqual(weakest(list).map((c) => c.concept), ['logic:series']);
  assert.deepEqual(strongest(list).map((c) => c.concept), ['quant:percentages']);
  assert.equal(genreMastery(list, 'data'), null); // only one question answered
  assert.ok((genreMastery(list, 'logic') as number) < 25);
});

test('practice set: same skill, wrong answers first, never more than the bank holds', () => {
  const none = buildPractice('quant', 'percentages', [])!;
  assert.equal(none.n, 0);
  assert.equal(none.id, 'quant-practice-percentages');
  assert.ok(none.questions.length >= 2 && none.questions.length <= 3);
  assert.ok(none.questions.every((q) => q.concept === 'quant:percentages'));
  const missedSecond = buildPractice('quant', 'percentages', [att(none.questions[1].id, false)])!;
  assert.equal(missedSecond.questions[0].id, none.questions[1].id);
  assert.equal(buildPractice('quant', 'no-such-skill', []), undefined);
  assert.equal(practiceId('quant:percentages'), 'quant-practice-percentages');
  assert.equal(conceptLabel('quant:percentages'), 'Percentages');
});

test('answers from retired content are ignored by mastery', () => {
  const kept = currentAttempts([att('a', true, 0, 'quant:percentages'), att('x', false, 0, 'ratio'), att('y', true, 0, 'percentages')]);
  assert.deepEqual(kept.map((a) => a.concept), ['quant:percentages']);
});

test('every question in the game (authored and generated) has metadata for mastery', () => {
  assert.equal(Object.keys(QUESTION_META).length, 600);
});
