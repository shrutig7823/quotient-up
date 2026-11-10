import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ALL_RECORDS, GENRE_IDS, LEVELS, SUMMIT_QUESTIONS, toQuestion } from '../src/content/bank';
import { computeStars, rewardFor, rewardToGrant } from '../src/engine/scoring';
import { migrateState } from '../src/state/migrate';
import { parseFraction, validate } from '../src/questions/validate';
import type { EntryQuestion } from '../src/questions/types';

const entry = (format: EntryQuestion['format'], answer: string): EntryQuestion => ({
  id: 't', type: 'entry', concept: 't', difficulty: 1, expectedSeconds: 30, explanation: '', prompt: '', format, answer,
});

test('bank: 240 genre records, 40 per genre, unique ids; 20 Summit records', () => {
  assert.equal(ALL_RECORDS.length, 240);
  assert.equal(new Set(ALL_RECORDS.map((r) => r.id)).size, 240);
  for (const g of GENRE_IDS) assert.equal(ALL_RECORDS.filter((r) => r.genreId === g).length, 40, g);
  assert.equal(SUMMIT_QUESTIONS.length, 20);
});

test('bank: 20 levels per genre; every level has 2 authored + 3 generated questions', () => {
  for (const g of GENRE_IDS) {
    assert.equal(LEVELS[g].length, 20);
    for (const l of LEVELS[g]) {
      assert.equal(l.questions.length, 5, `${g} level ${l.n}`);
      assert.equal(l.questions.filter((q) => q.id.startsWith('GEN-')).length, 3, `${g} level ${l.n} generated`);
      assert.equal(new Set(l.questions.map((q) => ('prompt' in q ? q.prompt : q.id))).size, 5, `${g} level ${l.n} duplicate prompts`);
    }
  }
  const all = GENRE_IDS.flatMap((g) => LEVELS[g].flatMap((l) => l.questions));
  assert.equal(new Set(all.map((q) => q.id)).size, 600); // 240 authored + 360 generated, all ids unique
});

test('bank: difficulty is exactly 30/50/20 and follows levels 1-6 / 7-16 / 17-20', () => {
  const count = (d: string) => ALL_RECORDS.filter((r) => r.difficulty === d).length;
  assert.deepEqual([count('easy'), count('medium'), count('hard')], [72, 120, 48]);
  for (const g of GENRE_IDS) {
    for (const l of LEVELS[g]) {
      const want = l.n <= 6 ? 1 : l.n <= 16 ? 2 : 3;
      for (const q of l.questions) assert.equal(q.difficulty, want, `${g} level ${l.n}`);
    }
  }
});

test('bank: every select question has options that include its answer (no fallbacks needed)', () => {
  for (const r of ALL_RECORDS.filter((x) => x.answerFormat === 'select')) {
    const q = toQuestion(r);
    assert.equal(q.type, 'choice', r.id);
    if (q.type === 'choice') {
      assert.ok(q.choices.some((c) => c.id === q.answerId), r.id);
      assert.equal(new Set(q.choices.map((c) => c.label)).size, q.choices.length, `${r.id} duplicate options`);
    }
  }
});

test('bank: the stated answer is accepted by the checker for all 240 questions', () => {
  for (const g of GENRE_IDS) {
    for (const l of LEVELS[g]) {
      for (const q of l.questions) {
        const given = q.type === 'choice' ? q.answerId : q.type === 'entry' ? q.answer : '';
        assert.equal(validate(q, given), true, q.id);
      }
    }
  }
});

test('bank: every numeric answer parses as an exact fraction', () => {
  for (const r of ALL_RECORDS.filter((x) => x.answerFormat === 'numeric')) assert.ok(parseFraction(r.answer), r.id);
});

test('validate: exact fractions, no tolerance', () => {
  const q = entry('numeric', '36/5');
  assert.equal(validate(q, '7.2'), true);
  assert.equal(validate(q, '36/5'), true);
  assert.equal(validate(q, '72/10'), true);
  assert.equal(validate(q, '7.21'), false);
  assert.equal(validate(q, '1/0'), false);
  assert.equal(validate(q, 'abc'), false);
  assert.equal(validate(q, '3/10/2'), false);
  assert.equal(validate(entry('numeric', '3/10'), '0.3'), true);
  assert.equal(validate(entry('numeric', '1200'), '₹1,200'), true);
  assert.equal(validate(entry('numeric', '25'), '25%'), true);
});

test('validate: coordinates are ordered pairs', () => {
  const q = entry('coordinate', '(3,4)');
  assert.equal(validate(q, '(3, 4)'), true);
  assert.equal(validate(q, '3,4'), true);
  assert.equal(validate(q, '(4,3)'), false);
  assert.equal(validate(entry('coordinate', '(-3,2)'), '(-3,2)'), true);
});

test('validate: order, sets, times and text aliases', () => {
  assert.equal(validate(entry('order', 'D,A,B,C'), 'd a b c'), true);
  assert.equal(validate(entry('order', 'D,A,B,C'), 'A, D, B, C'), false);
  assert.equal(validate(entry('text', 'A,C'), 'c, a'), true); // a set: order does not matter
  assert.equal(validate(entry('text', '09:45'), '9:45'), true);
  assert.equal(validate(entry('text', '09:45'), '9:46'), false);
  assert.equal(validate(entry('text', 'maternal uncle'), "Mother's brother"), true);
  assert.equal(validate(entry('text', 'DBNQ'), ' dbnq '), true);
  assert.equal(validate(entry('text', 'sister'), 'brother'), false);
});

test('scoring: star rules and replay protection still hold', () => {
  assert.equal(computeStars(2, 2, 30, 90), 3);
  assert.equal(computeStars(2, 2, 300, 90), 2);
  assert.equal(computeStars(1, 2, 10, 90), 1);
  assert.equal(computeStars(0, 2, 10, 90), 0);
  const first = rewardFor(2, 3);
  assert.deepEqual(rewardToGrant(first, first), { xp: 0, coins: 0 });
});

test('migration: v1 progress is preserved, not reassigned to the new levels', () => {
  const old = { xp: 225, coins: 95, levelStars: { 'quant:1': 3, 'quant:2': 2 }, levelBest: { 'quant:1': { xp: 130, coins: 55 } }, attempts: [1] };
  const next: any = migrateState(old, 1);
  assert.deepEqual(next.levelStars, {});
  assert.deepEqual(next.levelBest, {});
  assert.deepEqual(next.legacyProgress.levelStars, old.levelStars);
  assert.equal(next.xp, 225);
  assert.equal(next.coins, 95);
  assert.deepEqual(migrateState(next, 2), next); // already current: unchanged
});
