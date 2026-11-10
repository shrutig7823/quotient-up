import type { Answer, Question } from './types';

// ---- Exact numbers -------------------------------------------------------------------------
// Answers are compared as exact fractions, so 7.2, 36/5 and 7.20 are the same value and
// nothing is accepted by tolerance. We never use eval().
type Frac = { n: bigint; d: bigint };

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
const reduce = ({ n, d }: Frac): Frac => {
  const g = gcd(n, d) || 1n;
  const s = d < 0n ? -1n : 1n;
  return { n: (s * n) / g, d: (s * d) / g };
};

// Accepts: 12, -3, 7.2, 36/5, 1,200 (thousands comma), with an optional leading rupee sign or trailing %.
export function parseFraction(input: string): Frac | null {
  const s = input.trim().replace(/^₹\s*/, '').replace(/\s*%$/, '').replace(/(?<=\d),(?=\d{3}\b)/g, '').replace(/\s+/g, '');
  const dec = (t: string): Frac | null => {
    const m = t.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
    if (!m) return null;
    const frac = m[3] ?? '';
    const n = BigInt(m[2] + frac) * (m[1] === '-' ? -1n : 1n);
    return { n, d: 10n ** BigInt(frac.length) };
  };
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length !== 2) return null;
    const a = dec(parts[0]);
    const b = dec(parts[1]);
    if (!a || !b || b.n === 0n) return null; // reject division by zero
    return reduce({ n: a.n * b.d, d: a.d * b.n });
  }
  const v = dec(s);
  return v ? reduce(v) : null;
}

const sameNumber = (a: string, b: string) => {
  const x = parseFraction(a);
  const y = parseFraction(b);
  return !!x && !!y && x.n === y.n && x.d === y.d;
};

// ---- Text, codes, order, coordinates -------------------------------------------------------
const clean = (s: string) =>
  s.toLowerCase().replace(/[’‘]/g, "'").replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim();

// Approved aliases for relationship / phrase answers (keyed by the canonical answer).
const ALIASES: Record<string, string[]> = {
  grandmother: ['paternal grandmother', "father's mother"],
  'maternal uncle': ["mother's brother"],
  'maternal grandfather': ["mother's father"],
  'first cousin': ['cousin'],
};

const tokens = (s: string) => clean(s).split(/[\s,;>→-]+/).filter(Boolean);
const timeKey = (s: string) => {
  const m = clean(s).match(/^(\d{1,2}):(\d{2})$/);
  return m ? `${Number(m[1])}:${m[2]}` : null;
};
const parsePair = (s: string): [Frac, Frac] | null => {
  const m = s.trim().match(/^\(?\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)?$/);
  if (!m) return null;
  const a = parseFraction(m[1]);
  const b = parseFraction(m[2]);
  return a && b ? [a, b] : null;
};

function checkEntry(format: string, expected: string, given: string): boolean {
  if (!given.trim()) return false;
  if (format === 'numeric') return sameNumber(expected, given);
  if (format === 'coordinate') {
    const e = parsePair(expected);
    const g = parsePair(given);
    return !!e && !!g && e[0].n * g[0].d === g[0].n * e[0].d && e[1].n * g[1].d === g[1].n * e[1].d; // ordered pair
  }
  if (format === 'order') {
    const e = tokens(expected);
    const g = tokens(given);
    return e.length === g.length && e.every((t, i) => t === g[i]);
  }
  // text
  if (timeKey(expected)) return timeKey(expected) === timeKey(given);
  if (expected.includes(',')) {
    // a set such as "A,C": same members, order does not matter
    const e = tokens(expected).sort();
    const g = tokens(given).sort();
    return e.length === g.length && e.every((t, i) => t === g[i]);
  }
  const want = clean(expected);
  const got = clean(given);
  return got === want || (ALIASES[want] ?? []).includes(got);
}

// ---- Public API ----------------------------------------------------------------------------
export function correctAnswerOf(q: Question): Answer {
  switch (q.type) {
    case 'choice':
      return q.answerId;
    case 'entry':
      return q.answer;
    case 'mcq':
      return q.answerIndex;
    case 'sequence':
      return q.answer;
    case 'balance':
      return (q.leftValue * q.ratio[1]) / q.ratio[0]; // left : right = a : b
  }
}

// What to show the player after submission ("Correct answer: ...").
export function displayAnswer(q: Question): string {
  if (q.type === 'choice') return q.choices.find((c) => c.id === q.answerId)?.label ?? '';
  if (q.type === 'mcq') return q.options[q.answerIndex];
  return String(correctAnswerOf(q));
}

export function validate(q: Question, answer: Answer | null): boolean {
  if (answer === null || answer === '' || (typeof answer === 'number' && Number.isNaN(answer))) return false;
  if (q.type === 'entry') return checkEntry(q.format, q.answer, String(answer));
  return answer === correctAnswerOf(q);
}
