import type { ChoiceQuestion, EntryQuestion, Question } from '../../questions/types';
import { parseFraction } from '../../questions/validate';
import { hashSeed, rng, shuffle } from '../rng';
import { APPLIED_GENS } from './applied';
import { DATA_GENS } from './data';
import type { Gen, Tier } from './kit';
import { LOGIC_GENS } from './logic';
import { QUANT_GENS } from './quant';
import { SPATIAL_GENS } from './spatial';
import { VERBAL_GENS } from './verbal';

export const GENS: Record<string, Gen[]> = {
  quant: QUANT_GENS, logic: LOGIC_GENS, data: DATA_GENS, verbal: VERBAL_GENS, spatial: SPATIAL_GENS, applied: APPLIED_GENS,
};
export const GEN_PER_LEVEL = 3;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const DIFF: Record<Tier, 1 | 2 | 3> = { 1: 1, 2: 2, 3: 3 };

// Build one exam-style (A-D) question from a generator under a given id. The same (id, generator, tier)
// always yields the same question. A draft whose independent cross-check fails is thrown away and
// re-drawn, never shown.
function build(gen: Gen, id: string, genre: string, tier: Tier, taken: Set<string>): ChoiceQuestion {
  for (let attempt = 0; attempt < 40; attempt++) {
    const r = rng(hashSeed(id) + attempt * 7919);
    let draft;
    try {
      draft = gen.make(r, tier);
    } catch {
      continue;
    }
    const wrongs = [...new Set(draft.wrongs)].filter((w) => w !== draft.correct).slice(0, 3);
    if (!draft.verified || wrongs.length < 3 || taken.has(draft.prompt)) continue;
    const options = shuffle(r, [draft.correct, ...wrongs]);
    const choices = options.map((label, i) => ({ id: `${id}-c${i + 1}`, label }));
    taken.add(draft.prompt);
    return {
      id, type: 'choice', concept: `${genre}:${slug(gen.skill)}`, skill: gen.skill, difficulty: DIFF[tier], expectedSeconds: draft.seconds ?? 90,
      explanation: draft.explanation, prompt: draft.prompt, choices, answerId: choices[options.indexOf(draft.correct)].id,
    };
  }
  throw new Error(`could not generate a verified question for ${id} (${gen.id})`);
}

export function makeQuestion(gen: Gen, genre: string, level: number, slot: number, tier: Tier, taken: Set<string>): ChoiceQuestion {
  return build(gen, `GEN-${genre}-${level}-${slot + 1}`, genre, tier, taken);
}

// The generated questions for a level: GEN_PER_LEVEL different skills, rotating with the level number.
export function generateForLevel(genre: string, level: number, tier: Tier, avoid: string[] = []): ChoiceQuestion[] {
  const eligible = (GENS[genre] ?? []).filter((g) => g.tiers.includes(tier));
  const taken = new Set(avoid);
  return Array.from({ length: GEN_PER_LEVEL }, (_, i) => makeQuestion(eligible[(level * GEN_PER_LEVEL + i) % eligible.length], genre, level, i, tier, taken));
}

// ---- New versions of a missed question -------------------------------------------------------
// Which generator makes questions like this one? Words in the skill name decide; if none match we
// fall back to a generator in the same world at the same difficulty.
const KEYWORDS: Record<string, string[]> = {
  'quant-percent': ['percent'], 'quant-ratio': ['ratio', 'proportion'], 'quant-work': ['work', 'pipe'], 'quant-speed': ['speed', 'distance'],
  'quant-profit': ['profit', 'loss', 'discount', 'interest'], 'quant-mixture': ['mixture', 'alligation'],
  'logic-coding': ['coding', 'decoding'], 'logic-number-analogy': ['number analogy'], 'logic-series': ['series', 'sequence'],
  'logic-blood': ['blood', 'relation'], 'logic-direction': ['direction'], 'logic-ranking': ['rank', 'position'], 'logic-venn': ['venn', 'set'],
  'data-table': ['table', 'chart', 'pie', 'bar', 'line'], 'data-weighted': ['weighted', 'average', 'mean'], 'data-revenue': ['revenue', 'growth', 'profit', 'margin'],
  'spatial-transform': ['rotation', 'reflection', 'transform', 'coordinate', 'translation'], 'spatial-routes': ['path', 'grid', 'route'], 'spatial-cube': ['cube'],
  'applied-breakeven': ['break'], 'applied-bottleneck': ['capacity', 'bottleneck'], 'applied-expected': ['expected', 'cost', 'decision', 'probability'],
  'applied-scheduling': ['schedul', 'queue', 'critical'],
  'verbal-analogy': ['analogy'], 'verbal-odd': ['classification', 'odd'], 'verbal-vocab': ['vocabulary', 'nuance', 'contrast'],
  'verbal-syllogism': ['conclusion', 'statement', 'syllogism', 'deduction', 'assumption'],
};

export function findGenerator(genre: string, skillText: string, tier: Tier, seedText: string): Gen {
  const pool = GENS[genre] ?? [];
  const text = skillText.toLowerCase();
  const byName = pool.find((g) => `${genre}:${slug(g.skill)}` === `${genre}:${slug(skillText)}`);
  const byWord = pool.find((g) => (KEYWORDS[g.id] ?? []).some((k) => text.includes(k)));
  const chosen = byName ?? byWord;
  if (chosen) return chosen;
  const eligible = pool.filter((g) => g.tiers.includes(tier));
  const list = eligible.length ? eligible : pool;
  return list[hashSeed(seedText) % list.length];
}

const nearestTier = (gen: Gen, tier: Tier): Tier => (gen.tiers.includes(tier) ? tier : gen.tiers.reduce((a, b) => (Math.abs(b - tier) < Math.abs(a - tier) ? b : a)));

// A fresh question in the same style as `orig`, with different numbers or a different set-up.
// It keeps orig's skill, so answering it counts toward the same mastery. `n` picks which new version.
// If the original asked for a typed number, the new version does too (when its answer is a plain number).
export function variantOf(orig: Question, n: number): Question | undefined {
  const [genre, skillSlug] = orig.concept.split(':');
  if (!GENS[genre]) return undefined;
  const tier = (orig.difficulty ?? 2) as Tier;
  const gen = findGenerator(genre, orig.skill ?? skillSlug.replace(/-/g, ' '), tier, orig.id);
  const origPrompt = 'prompt' in orig ? orig.prompt : '';
  const q = build(gen, `RTY-${orig.id}-v${n}`, genre, nearestTier(gen, tier), new Set([origPrompt]));
  const same: ChoiceQuestion = { ...q, concept: orig.concept, skill: orig.skill ?? q.skill };
  if (orig.type === 'entry' && orig.format === 'numeric') {
    const label = same.choices.find((c) => c.id === same.answerId)!.label;
    if (parseFraction(label)) {
      const typed: EntryQuestion = {
        id: same.id, type: 'entry', concept: same.concept, skill: same.skill, difficulty: same.difficulty, expectedSeconds: same.expectedSeconds,
        explanation: same.explanation, prompt: same.prompt, format: 'numeric', answer: label,
      };
      return typed;
    }
  }
  return same;
}
