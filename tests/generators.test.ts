import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GENS, generateForLevel } from '../src/content/gen';
import type { Tier } from '../src/content/gen/kit';
import { rng } from '../src/content/rng';

const TIERS: Tier[] = [1, 2, 3];

test('every generator, every tier, 300 seeds: cross-check passes and options are clean', () => {
  const failures: string[] = [];
  let drafts = 0;
  for (const [genre, gens] of Object.entries(GENS)) {
    for (const g of gens) {
      for (const t of g.tiers) {
        for (let seed = 1; seed <= 300; seed++) {
          let d;
          try {
            d = g.make(rng(seed * 104729 + t), t);
          } catch (e) {
            failures.push(`${g.id} t${t} seed ${seed}: threw ${(e as Error).message}`);
            continue;
          }
          drafts++;
          const all = [d.correct, ...d.wrongs];
          const wrongs = [...new Set(d.wrongs)].filter((w) => w !== d.correct);
          if (!d.verified) failures.push(`${g.id} t${t} seed ${seed}: cross-check failed: ${d.prompt.slice(0, 80)}`);
          if (wrongs.length < 3) failures.push(`${g.id} t${t} seed ${seed}: only ${wrongs.length} distinct wrong options`);
          if (all.some((s) => /NaN|undefined|Infinity/.test(s)) || /NaN|undefined|Infinity/.test(d.prompt + d.explanation)) failures.push(`${g.id} t${t} seed ${seed}: bad text`);
          if (!d.prompt || !d.explanation) failures.push(`${g.id} t${t} seed ${seed}: empty text`);
          // Every option must look like the right answer: same currency sign, same unit, no stray digits in words.
          const shape = (s: string) => s.replace(/-?\d[\d.]*/g, '#').replace(/\b(profit|loss|increase|decrease)\b/g, 'X');
          const sh = shape(d.correct);
          if (/^₹/.test(d.correct) || /[a-z%]$/i.test(sh.replace('#', ''))) {
            for (const w of wrongs) if (/^[A-Z]{3,}$/.test(d.correct) ? /\d/.test(w) : shape(w) !== sh && /#/.test(sh)) failures.push(`${g.id} t${t} seed ${seed}: option "${w}" does not match the shape of "${d.correct}"`);
          }
          if (/^[A-Z]{3,}$/.test(d.correct) && wrongs.some((w) => /\d/.test(w))) failures.push(`${g.id} t${t} seed ${seed}: digits in a word code option`);
          void genre;
        }
      }
    }
  }
  assert.ok(drafts > 5000, `only ${drafts} drafts ran`);
  // Show the first few problems so they can be fixed; verified drafts are the only ones the app ever uses.
  assert.deepEqual(failures.slice(0, 15), [], `${failures.length} problem drafts out of ${drafts}`);
});

test('every level of every world gets 3 distinct, verified, exam-style questions', () => {
  for (const genre of Object.keys(GENS)) {
    for (let n = 1; n <= 20; n++) {
      const tier: Tier = n <= 6 ? 1 : n <= 16 ? 2 : 3;
      const qs = generateForLevel(genre, n, tier);
      assert.equal(qs.length, 3, `${genre} ${n}`);
      assert.equal(new Set(qs.map((q) => q.prompt)).size, 3, `${genre} ${n} duplicate prompts`);
      for (const q of qs) {
        assert.equal(q.choices.length, 4, q.id);
        assert.equal(new Set(q.choices.map((c) => c.label)).size, 4, `${q.id} duplicate options`);
        assert.ok(q.choices.some((c) => c.id === q.answerId), q.id);
        assert.equal(q.difficulty, tier);
      }
    }
  }
});

test('generation is deterministic: the same level always gives the same questions', () => {
  const a = generateForLevel('quant', 9, 2).map((q) => [q.id, q.prompt, q.choices.map((c) => c.label), q.answerId]);
  const b = generateForLevel('quant', 9, 2).map((q) => [q.id, q.prompt, q.choices.map((c) => c.label), q.answerId]);
  assert.deepEqual(a, b);
});

test('the correct option is not always in the same position', () => {
  const pos = new Set<number>();
  for (let n = 1; n <= 20; n++) for (const q of generateForLevel('logic', n, n <= 6 ? 1 : n <= 16 ? 2 : 3)) pos.add(q.choices.findIndex((c) => c.id === q.answerId));
  assert.equal(pos.size, 4);
});
