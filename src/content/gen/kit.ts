import { type Rng, pick, ri } from '../rng';

export type Tier = 1 | 2 | 3; // easy / medium / hard

// A generator returns a draft: the prompt, the one correct option, believable wrong options
// (each built from a typical mistake), a worked explanation and an independent cross-check.
export type Draft = {
  prompt: string;
  correct: string;
  wrongs: string[];
  explanation: string;
  verified: boolean; // computed by a DIFFERENT method than the main answer; tests require true
  seconds?: number;
};

export type Gen = { id: string; genre: string; skill: string; tiers: Tier[]; make: (r: Rng, tier: Tier) => Draft };

export const fmt = (n: number) => String(Math.round(n * 100) / 100);
export const money = (n: number) => `₹${fmt(n)}`;
export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const secs = (t: Tier) => (t === 1 ? 60 : t === 2 ? 100 : 160);

// Retry random draws until a condition holds, so numbers always work out cleanly.
export function until<T>(r: Rng, draw: () => T, ok: (v: T) => boolean, tries = 400): T {
  for (let i = 0; i < tries; i++) {
    const v = draw();
    if (ok(v)) return v;
  }
  throw new Error('generator could not find clean numbers');
}

// Choose three distinct wrong options: the mistake-based ones first, then nearby values for numbers.
export function wrongOptions(correct: string, mistakes: string[], r: Rng): string[] {
  // Split "₹1,200 per kg" style answers into prefix / number / unit so nudged options keep the same shape.
  const m = correct.match(/^(₹?)(-?\d[\d.]*)(.*)$/);
  const prefix = m?.[1] ?? '';
  const unit = m?.[3] ?? '';
  const n = m ? Number(m[2]) : NaN;
  const wholeAnswer = !!m && !m[2].includes('.');
  const out: string[] = [];
  const add = (s: string) => {
    if (s === correct || out.includes(s) || s === 'NaN' || s.includes('Infinity') || s.includes('-0')) return;
    if (wholeAnswer && /\d\.\d/.test(s)) return; // a whole-number answer never gets a fractional distractor
    if (m && Number.isFinite(n)) {
      const v = Number(s.replace(/[^\d.-]/g, ''));
      if (Number.isFinite(v) && n > 0 && (v > n * 4 || v < n / 4)) return; // keep distractors in a believable range
    }
    out.push(s);
  };
  mistakes.forEach(add);
  // Letter codes: near-misses that differ from the right answer in one letter.
  if (!m && /^[A-Z]{3,}$/.test(correct)) {
    let tries = 0;
    while (out.length < 3 && tries++ < 60) {
      const i = ri(r, 0, correct.length - 1);
      const d = r() < 0.5 ? -1 : 1;
      const ch = String.fromCharCode(((correct.charCodeAt(i) - 65 + d + 26) % 26) + 65);
      add(correct.slice(0, i) + ch + correct.slice(i + 1));
    }
  }
  let guard = 0;
  while (out.length < 3 && Number.isFinite(n) && guard++ < 80) {
    const step = Math.max(1, Math.round(Math.abs(n) * 0.1)) * ri(r, 1, 3);
    const v = n + (r() < 0.5 ? -step : step);
    if (v > 0 || n < 0) add(`${prefix}${fmt(v)}${unit}`);
  }
  return out.slice(0, 3);
}

export const letter = (i: number) => 'ABCDEFGH'[i];
export { pick, ri };
