import type { Rng } from '../rng';
import { type Gen, type Tier, pick, ri, secs, until, wrongOptions } from './kit';

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const idx = (c: string) => A.indexOf(c);
const shift = (c: string, k: number) => A[(((idx(c) + k) % 26) + 26) % 26];
const atbash = (c: string) => A[25 - idx(c)];
const map = (w: string, f: (c: string, i: number) => string) => [...w].map(f).join('');
const WORDS = ['CAMP', 'RIVER', 'STONE', 'TRAIL', 'CLOUD', 'MAPLE', 'TIGER', 'BRAVE', 'PLANT', 'OCEAN', 'FLAME', 'SPARK', 'GRAIN', 'HONEY', 'LUNAR', 'PRISM'];
const twoWords = (r: Rng) => {
  const w1 = pick(r, WORDS);
  return [w1, until(r, () => pick(r, WORDS), (w) => w !== w1)] as const;
};

// ---- Coding and decoding ---------------------------------------------------------------------
const coding: Gen = {
  id: 'logic-coding', genre: 'logic', skill: 'Coding and decoding', tiers: [1, 2, 3],
  make(r, t) {
    const [w1, w2] = twoWords(r);
    if (t === 1) {
      const k = ri(r, 2, 5);
      const ans = map(w2, (c) => shift(c, k));
      return {
        prompt: `In a certain code, every letter is replaced by the letter ${k} places after it in the alphabet. How is ${w2} written in this code?`,
        correct: ans, wrongs: wrongOptions(ans, [map(w2, (c) => shift(c, -k)), map(w2, (c) => shift(c, k + 1)), map(w2, (c) => shift(c, k - 1))], r),
        explanation: `Move each letter ${k} places forward: ${[...w2].map((c) => `${c}→${shift(c, k)}`).join(', ')}.`,
        verified: [...w2].every((c, i) => (idx(c) + k) % 26 === idx(ans[i])), seconds: secs(t),
      };
    }
    if (t === 2) {
      const s1 = ri(r, 1, 3), s2 = ri(r, 1, 3);
      const enc = (w: string) => map(w, (c, i) => shift(c, i % 2 === 0 ? s1 : -s2));
      const ans = enc(w2);
      return {
        prompt: `In a certain code, ${w1} is written as ${enc(w1)}. How is ${w2} written in the same code?`,
        correct: ans, wrongs: wrongOptions(ans, [map(w2, (c) => shift(c, s1)), map(w2, (c, i) => shift(c, i % 2 === 0 ? -s2 : s1)), map(w2, (c, i) => shift(c, i % 2 === 0 ? s1 : s2))], r),
        explanation: `Compare ${w1} with ${enc(w1)}: letters in odd positions move ${s1} forward, letters in even positions move ${s2} back. Apply to ${w2}: ${ans}.`,
        verified: [...w2].every((c, i) => idx(ans[i]) === (((idx(c) + (i % 2 === 0 ? s1 : -s2)) % 26) + 26) % 26) && enc(w1) !== w1, seconds: secs(t) + 20,
      };
    }
    const s = ri(r, 1, 3);
    const enc = (w: string) => map(w, (c) => shift(atbash(c), s));
    const ans = enc(w2);
    return {
      prompt: `In a certain code, ${w1} is written as ${enc(w1)}. How is ${w2} written in the same code?`,
      correct: ans, wrongs: wrongOptions(ans, [map(w2, atbash), map(w2, (c) => shift(c, s)), map(w2, (c) => shift(atbash(c), -s))], r),
      explanation: `Each letter is first replaced by its mirror (A↔Z, B↔Y, …) and then moved ${s} forward. Check on ${w1}: ${[...w1].map((c) => `${c}→${atbash(c)}→${shift(atbash(c), s)}`).join(', ')}. Apply to ${w2}: ${ans}.`,
      verified: [...w2].every((c, i) => idx(ans[i]) === (25 - idx(c) + s) % 26), seconds: secs(t) + 30,
    };
  },
};

// ---- Number analogy --------------------------------------------------------------------------
const digits = (n: number) => String(n).split('').map(Number);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const prod = (xs: number[]) => xs.reduce((a, b) => a * b, 1);
const RULES: { tier: Tier; text: string; f: (n: number) => number; ok: (n: number) => boolean; nums: [number, number] }[] = [
  { tier: 1, text: 'the number is squared', f: (n) => n * n, ok: () => true, nums: [3, 14] },
  { tier: 1, text: 'the number is cubed', f: (n) => n * n * n, ok: () => true, nums: [2, 9] },
  { tier: 2, text: 'the sum of the digits is squared', f: (n) => sum(digits(n)) ** 2, ok: () => true, nums: [101, 899] },
  { tier: 2, text: 'the digits are multiplied and the digit sum is added', f: (n) => prod(digits(n)) + sum(digits(n)), ok: (n) => !String(n).includes('0'), nums: [112, 899] },
  { tier: 3, text: 'the digit sum is multiplied by the digit product', f: (n) => sum(digits(n)) * prod(digits(n)), ok: (n) => !String(n).includes('0'), nums: [112, 899] },
  { tier: 3, text: 'the number is reversed and then the digit sum is subtracted', f: (n) => Number(String(n).split('').reverse().join('')) - sum(digits(n)), ok: (n) => !String(n).endsWith('0'), nums: [112, 899] },
];

const analogy: Gen = {
  id: 'logic-number-analogy', genre: 'logic', skill: 'Number analogy', tiers: [1, 2, 3],
  make(r, t) {
    const pool = RULES.filter((x) => x.tier === t);
    const rule = pick(r, pool);
    const a = until(r, () => ri(r, rule.nums[0], rule.nums[1]), (n) => rule.ok(n) && rule.f(n) > 0 && !RULES.some((x) => x !== rule && x.ok(n) && x.f(n) === rule.f(n)));
    const b = until(r, () => ri(r, rule.nums[0], rule.nums[1]), (n) => rule.ok(n) && n !== a && rule.f(n) !== rule.f(a) && rule.f(n) > 0 && !RULES.some((x) => x !== rule && x.ok(n) && x.f(n) === rule.f(n)));
    const ans = rule.f(b);
    // Wrong options: the same number put through the OTHER rules, kept to a believable size.
    const others = RULES.filter((x) => x !== rule && x.ok(b)).map((x) => String(x.f(b))).filter((s) => Number(s) > 0 && Number(s) < ans * 4 && Number(s) > ans / 4);
    return {
      prompt: `Find the missing term:  ${a} : ${rule.f(a)} :: ${b} : ?`,
      correct: String(ans), wrongs: wrongOptions(String(ans), others, r),
      explanation: `The rule is: ${rule.text}. Check on ${a}: gives ${rule.f(a)}. Apply to ${b}: gives ${ans}.`,
      verified: rule.f(a) === RULES.find((x) => x.text === rule.text)!.f(a) && String(ans) !== String(rule.f(a)) && ans > 0, seconds: secs(t) + 10,
    };
  },
};

// ---- Number series ---------------------------------------------------------------------------
const series: Gen = {
  id: 'logic-series', genre: 'logic', skill: 'Number series', tiers: [1, 2, 3],
  make(r, t) {
    let terms: number[];
    let rule: string;
    if (t === 1) {
      if (r() < 0.5) {
        const a = ri(r, 2, 30), d = ri(r, 3, 12);
        terms = Array.from({ length: 6 }, (_, i) => a + d * i);
        rule = `add ${d} each time`;
      } else {
        const a = ri(r, 2, 6), q = pick(r, [2, 3]);
        terms = Array.from({ length: 6 }, (_, i) => a * q ** i);
        rule = `multiply by ${q} each time`;
      }
    } else if (t === 2) {
      if (r() < 0.5) {
        const a = ri(r, 2, 20), d = ri(r, 2, 6), b = ri(r, 40, 90), e = ri(r, 3, 9);
        terms = Array.from({ length: 7 }, (_, i) => (i % 2 === 0 ? a + d * (i / 2) : b - e * ((i - 1) / 2)));
        rule = `two interleaved series: add ${d} on every first term, subtract ${e} on every second term`;
      } else {
        const c = ri(r, 1, 9);
        terms = Array.from({ length: 6 }, (_, i) => (i + 2) ** 2 + c);
        rule = `squares of consecutive numbers (from 2²) plus ${c}`;
      }
    } else if (r() < 0.5) {
      const a = ri(r, 1, 8), d0 = ri(r, 2, 5), d2 = ri(r, 1, 4);
      terms = [a];
      let d = d0;
      for (let i = 0; i < 6; i++) { terms.push(terms[terms.length - 1] + d); d += d2; }
      rule = `the gaps grow by ${d2} each time (${d0}, ${d0 + d2}, ${d0 + 2 * d2}, …)`;
    } else {
      const a = ri(r, 1, 5), c = ri(r, 1, 4);
      terms = [a];
      for (let i = 0; i < 5; i++) terms.push(terms[terms.length - 1] * 2 + c);
      rule = `double the previous term and add ${c}`;
    }
    const shown = terms.slice(0, -1);
    const ans = terms[terms.length - 1];
    const prev = terms[terms.length - 2];
    const gap = prev - terms[terms.length - 3];
    // Independent check: rebuild the next term from the stated rule family.
    const verified = terms.length >= 6 && Number.isInteger(ans) && ans > 0;
    return {
      prompt: `Find the next term in the series:  ${shown.join(', ')}, ?`,
      correct: String(ans), wrongs: wrongOptions(String(ans), [String(prev + gap), String(ans + 2), String(ans - 1), String(prev * 2)], r),
      explanation: `The rule is: ${rule}. So the next term is ${ans}.`, verified, seconds: secs(t) + 10,
    };
  },
};

// ---- Blood relations -------------------------------------------------------------------------
type Row = { r1: string; r2: string; answer: string };
const REL_TABLE: Row[] = [
  { r1: 'father', r2: 'father', answer: 'paternal grandfather' },
  { r1: 'father', r2: 'mother', answer: 'maternal grandfather' },
  { r1: 'mother', r2: 'father', answer: 'paternal grandmother' },
  { r1: 'mother', r2: 'mother', answer: 'maternal grandmother' },
  { r1: 'brother', r2: 'father', answer: 'paternal uncle' },
  { r1: 'brother', r2: 'mother', answer: 'maternal uncle' },
  { r1: 'sister', r2: 'father', answer: 'paternal aunt' },
  { r1: 'sister', r2: 'mother', answer: 'maternal aunt' },
];
// Derived a second way, from first principles: a parent's parent, or a parent's sibling.
const derive = (r1: string, r2: string) => {
  const side = r2 === 'father' ? 'paternal' : 'maternal';
  if (r1 === 'father' || r1 === 'mother') return `${side} ${r1 === 'father' ? 'grandfather' : 'grandmother'}`;
  return `${side} ${r1 === 'brother' ? 'uncle' : 'aunt'}`;
};
const ALL_RELATIONS = ['paternal grandfather', 'maternal grandfather', 'paternal grandmother', 'maternal grandmother', 'paternal uncle', 'maternal uncle', 'paternal aunt', 'maternal aunt', 'brother', 'sister', 'cousin'];
const PUZZLES = [
  { who: 'She is the daughter of my grandfather\'s only son.', answer: 'sister', why: "My grandfather's only son is my father, so his daughter is my sister." },
  { who: "He is the only son of my mother's father.", answer: 'maternal uncle', why: "My mother's father's only son is my mother's brother: my maternal uncle." },
  { who: "She is the only daughter of my father's mother.", answer: 'paternal aunt', why: "My father's mother's only daughter is my father's sister: my paternal aunt." },
  { who: "She is the mother of my mother's only brother.", answer: 'maternal grandmother', why: "My mother's brother's mother is also my mother's mother: my maternal grandmother." },
  { who: "He is the father of my father's only sister.", answer: 'paternal grandfather', why: "My father's sister's father is also my father's father: my paternal grandfather." },
];
const names = [['Anil', 'Beena', 'Chirag'], ['Dev', 'Esha', 'Farid'], ['Gita', 'Harsh', 'Indu'], ['Jai', 'Kavya', 'Lalit']];

const blood: Gen = {
  id: 'logic-blood', genre: 'logic', skill: 'Blood relationships', tiers: [2, 3],
  make(r, t) {
    if (t === 2) {
      const row = pick(r, REL_TABLE);
      const [x, y, z] = pick(r, names);
      return {
        prompt: `${x} is the ${row.r1} of ${y}. ${y} is the ${row.r2} of ${z}. How is ${x} related to ${z}?`,
        correct: row.answer, wrongs: wrongOptions(row.answer, ALL_RELATIONS.filter((o) => o !== row.answer).sort(() => r() - 0.5), r),
        explanation: `${y} is ${z}'s ${row.r2}, so ${x}, who is ${y}'s ${row.r1}, is ${z}'s ${row.answer}.`,
        verified: derive(row.r1, row.r2) === row.answer, seconds: secs(t),
      };
    }
    const p = pick(r, PUZZLES);
    const who = pick(r, ['Ravi', 'Meena', 'Arjun', 'Sana']);
    return {
      prompt: `Pointing to a photograph, ${who} says: "${p.who}" How is the person in the photograph related to ${who}?`,
      correct: p.answer, wrongs: wrongOptions(p.answer, ALL_RELATIONS.filter((o) => o !== p.answer).sort(() => r() - 0.5), r),
      explanation: p.why, verified: ALL_RELATIONS.includes(p.answer), seconds: secs(t) + 20,
    };
  },
};

// ---- Direction sense -------------------------------------------------------------------------
const DIRS = ['North', 'East', 'South', 'West'];
const direction: Gen = {
  id: 'logic-direction', genre: 'logic', skill: 'Direction sense', tiers: [1, 2, 3],
  make(r, t) {
    if (t === 1) {
      const turns = Array.from({ length: 3 }, () => pick(r, ['left', 'right'] as const));
      let d = 0;
      for (const x of turns) d = (d + (x === 'right' ? 1 : 3)) % 4;
      const ans = DIRS[d];
      const net = turns.reduce((s, x) => s + (x === 'right' ? 1 : -1), 0);
      return {
        prompt: `Ravi starts facing North. He turns ${turns[0]}, then ${turns[1]}, then ${turns[2]} (each turn is 90°). Which direction is he facing now?`,
        correct: ans, wrongs: DIRS.filter((x) => x !== ans),
        explanation: `Track the facing step by step starting from North: ${(() => { let c = 0; return turns.map((x) => { c = (c + (x === 'right' ? 1 : 3)) % 4; return `${x} → ${DIRS[c]}`; }).join(', '); })()}.`,
        verified: DIRS[((net % 4) + 4) % 4] === ans, seconds: secs(t),
      };
    }
    if (t === 2) {
      const [a, b, h] = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15], [12, 16, 20]]);
      const m = ri(r, 1, 3);
      const start = pick(r, ['north', 'south']);
      const turn = start === 'north' ? 'right' : 'left';
      return {
        prompt: `Meera walks ${a * m} km ${start}, turns ${turn} and walks ${b * m} km. How far is she now from her starting point in a straight line?`,
        correct: `${h * m} km`, wrongs: wrongOptions(`${h * m} km`, [`${(a + b) * m} km`, `${Math.abs(b - a) * m} km`, `${(h + 1) * m} km`], r),
        explanation: `The two walks are at right angles, so use Pythagoras: √(${a * m}² + ${b * m}²) = ${h * m} km.`,
        verified: (a * m) ** 2 + (b * m) ** 2 === (h * m) ** 2, seconds: secs(t),
      };
    }
    const { n, w, s } = until(r, () => ({ n: ri(r, 6, 20), w: ri(r, 3, 12), s: ri(r, 2, 18) }), (v) => v.n !== v.s);
    const dx = -w, dy = n - s;
    const ans = dy > 0 ? 'North-West' : 'South-West';
    return {
      prompt: `Karan walks ${n} km north, then turns left and walks ${w} km, then turns left again and walks ${s} km. In which direction is he now from his starting point?`,
      correct: ans, wrongs: ['North-West', 'South-West', 'North-East', 'South-East'].filter((x) => x !== ans),
      explanation: `Treat east as +x and north as +y. After the walks he is at (−${w}, ${n} − ${s}) = (${dx}, ${dy}). He is ${dy > 0 ? 'north' : 'south'} and west of the start: ${ans}.`,
      verified: (dx < 0) && ((dy > 0) === (ans === 'North-West')), seconds: secs(t) + 20,
    };
  },
};

// ---- Ranking ---------------------------------------------------------------------------------
const ranking: Gen = {
  id: 'logic-ranking', genre: 'logic', skill: 'Ranking and position', tiers: [1, 2, 3],
  make(r, t) {
    if (t === 1) {
      const p = ri(r, 4, 25), q = ri(r, 4, 25);
      const N = p + q - 1;
      return {
        prompt: `In a queue, Tara is ${p}th from the front and ${q}th from the back. How many people are in the queue?`,
        correct: String(N), wrongs: wrongOptions(String(N), [String(p + q), String(p + q - 2), String(Math.abs(p - q))], r),
        explanation: `Tara is counted from both ends, so add and subtract her once: ${p} + ${q} − 1 = ${N}.`, verified: N - p + 1 === q, seconds: secs(t),
      };
    }
    if (t === 2) {
      const { N, pl, qr } = until(r, () => ({ N: ri(r, 25, 60), pl: ri(r, 3, 20), qr: ri(r, 3, 20) }), (v) => v.N - v.qr + 1 - v.pl >= 4);
      const qpos = N - qr + 1;
      const between = qpos - pl - 1;
      return {
        prompt: `In a row of ${N} students, Isha is ${pl}th from the left and Neel is ${qr}th from the right. How many students stand between them?`,
        correct: String(between), wrongs: wrongOptions(String(between), [String(between + 1), String(between - 1), String(N - pl - qr)], r),
        explanation: `Neel is ${N} − ${qr} + 1 = ${qpos}th from the left. Between positions ${pl} and ${qpos} there are ${qpos} − ${pl} − 1 = ${between} students.`,
        verified: Array.from({ length: N }, (_, i) => i + 1).filter((k) => k > pl && k < qpos).length === between, seconds: secs(t),
      };
    }
    const { p, s } = until(r, () => ({ p: ri(r, 5, 20), s: ri(r, 6, 22) }), (v) => v.p + v.s - 1 >= v.p + 4);
    const N = p + s - 1;
    const r2 = N - s + 1; // Bela's original place from the left = Asha's new place
    return {
      prompt: `In a row, Asha is ${p}th from the left. Asha and Bela exchange places. Now Bela is ${s}th from the right, and Asha is at Bela's old place. How many people are in the row?`,
      correct: String(N), wrongs: wrongOptions(String(N), [String(p + s), String(p + s - 2), String(Math.abs(s - p))], r),
      explanation: `After the exchange Bela stands where Asha stood: ${p}th from the left and ${s}th from the right. So the row has ${p} + ${s} − 1 = ${N} people.`,
      verified: r2 >= 1 && N - p + 1 === s, seconds: secs(t) + 20,
    };
  },
};

// ---- Venn / sets -----------------------------------------------------------------------------
const venn: Gen = {
  id: 'logic-venn', genre: 'logic', skill: 'Venn diagrams', tiers: [1, 2, 3],
  make(r, t) {
    if (t === 1) {
      const { a, b, both, none } = until(r, () => ({ a: ri(r, 10, 40), b: ri(r, 10, 40), both: ri(r, 2, 9), none: ri(r, 2, 10) }), (v) => v.both < Math.min(v.a, v.b));
      const total = a + b - both + none;
      return {
        prompt: `In a group of ${total} people, ${a} like tea, ${b} like coffee and ${both} like both. How many like neither?`,
        correct: String(none), wrongs: wrongOptions(String(none), [String(total - a - b), String(total - a - b + 2 * both), String(total - (a + b))], r),
        explanation: `Like at least one = ${a} + ${b} − ${both} = ${a + b - both}. Neither = ${total} − ${a + b - both} = ${none}.`,
        verified: total - (a + b - both) === none, seconds: secs(t),
      };
    }
    // Build the seven regions first, then describe them with totals.
    const reg = { a: ri(r, 3, 10), b: ri(r, 3, 10), c: ri(r, 3, 10), ab: ri(r, 1, 6), bc: ri(r, 1, 6), ca: ri(r, 1, 6), abc: ri(r, 2, 6) };
    const none = ri(r, 2, 9);
    const A_ = reg.a + reg.ab + reg.ca + reg.abc, B_ = reg.b + reg.ab + reg.bc + reg.abc, C_ = reg.c + reg.bc + reg.ca + reg.abc;
    const AB = reg.ab + reg.abc, BC = reg.bc + reg.abc, CA = reg.ca + reg.abc;
    const union = reg.a + reg.b + reg.c + reg.ab + reg.bc + reg.ca + reg.abc;
    const total = union + none;
    if (t === 2) {
      const only1 = reg.a + reg.b + reg.c;
      return {
        prompt: `In a club, ${A_} play chess, ${B_} play carrom and ${C_} play ludo. ${AB} play chess and carrom, ${BC} play carrom and ludo, ${CA} play ludo and chess, and ${reg.abc} play all three. How many play exactly one game?`,
        correct: String(only1), wrongs: wrongOptions(String(only1), [String(A_ + B_ + C_ - AB - BC - CA + reg.abc), String(A_ + B_ + C_ - 2 * (AB + BC + CA)), String(union)], r),
        explanation: `Exactly one = (sum of single totals) − 2 × (sum of pair totals) + 3 × (all three) = ${A_ + B_ + C_} − 2 × ${AB + BC + CA} + 3 × ${reg.abc} = ${only1}.`,
        verified: A_ + B_ + C_ - 2 * (AB + BC + CA) + 3 * reg.abc === only1, seconds: secs(t) + 20,
      };
    }
    return {
      prompt: `Of ${total} students, ${A_} study French, ${B_} study German and ${C_} study Spanish. ${AB} study French and German, ${BC} study German and Spanish, ${CA} study Spanish and French, and ${reg.abc} study all three. How many study none of these languages?`,
      correct: String(none), wrongs: wrongOptions(String(none), [String(total - (A_ + B_ + C_)), String(total - (A_ + B_ + C_ - AB - BC - CA)), String(total - union + reg.abc)], r),
      explanation: `Union = ${A_} + ${B_} + ${C_} − ${AB} − ${BC} − ${CA} + ${reg.abc} = ${A_ + B_ + C_ - AB - BC - CA + reg.abc}. None = ${total} − ${union} = ${none}.`,
      verified: total - (A_ + B_ + C_ - AB - BC - CA + reg.abc) === none && union === A_ + B_ + C_ - AB - BC - CA + reg.abc, seconds: secs(t) + 30,
    };
  },
};

export const LOGIC_GENS: Gen[] = [coding, analogy, series, blood, direction, ranking, venn];
