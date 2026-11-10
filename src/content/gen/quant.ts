import type { Rng } from '../rng';
import { type Draft, type Gen, type Tier, fmt, money, pick, ri, secs, until, wrongOptions } from './kit';

const days = (n: number) => `${fmt(n)} days`;

// ---- Percentages -----------------------------------------------------------------------------
const percent: Gen = {
  id: 'quant-percent', genre: 'quant', skill: 'Percentage changes', tiers: [1, 2, 3],
  make(r, t) {
    if (t === 1) {
      const p = pick(r, [10, 15, 20, 25, 30, 40, 60]);
      const N = ri(r, 4, 40) * 20;
      const ans = (N * p) / 100;
      return {
        prompt: `A shop stocks ${N} items and ${p}% of them are on sale. How many items are on sale?`,
        correct: fmt(ans), wrongs: wrongOptions(fmt(ans), [fmt(N - ans), fmt((N * p) / 10), fmt(N / p)], r),
        explanation: `${p}% of ${N} = ${N} × ${p}/100 = ${fmt(ans)}.`, verified: ans * 100 === N * p && Number.isInteger(ans), seconds: secs(t),
      };
    }
    if (t === 2) {
      const { P, a, b } = until(r, () => ({ P: ri(r, 2, 30) * 100, a: pick(r, [10, 20, 25, 30, 40, 50]), b: pick(r, [10, 20, 25, 30, 40, 50]) }), (v) => (100 + v.a) * (100 - v.b) % 100 === 0 && v.a !== v.b);
      const fin = (P * (100 + a) * (100 - b)) / 10000;
      const up = P + (P * a) / 100;
      const stepwise = up - (up * b) / 100;
      return {
        prompt: `A price of ${money(P)} is increased by ${a}% and the new price is then reduced by ${b}%. What is the final price?`,
        correct: money(fin), wrongs: wrongOptions(money(fin), [money(P), money(P + (P * (a - b)) / 100), money(up)], r),
        explanation: `After the rise: ${money(P)} × ${100 + a}/100 = ${money(up)}. After the fall: ${money(up)} × ${100 - b}/100 = ${money(fin)}. Equal-looking changes do not cancel.`,
        verified: Math.abs(stepwise - fin) < 1e-9, seconds: secs(t),
      };
    }
    const { O, a, b } = until(r, () => ({ O: ri(r, 2, 16) * 100, a: pick(r, [10, 20, 25, 30, 40, 50]), b: pick(r, [10, 20, 25, 30, 40, 50]) }), (v) => (100 + v.a) * (100 - v.b) % 100 === 0 && v.a !== v.b);
    const X = (O * (100 + a) * (100 - b)) / 10000;
    return {
      prompt: `A number is increased by ${a}% and the result is then decreased by ${b}%. The final value is ${X}. What was the original number?`,
      correct: fmt(O), wrongs: wrongOptions(fmt(O), [fmt(Math.round((X * 100) / (100 + a - b))), fmt(Math.round(X * (1 - (a - b) / 100))), fmt(Math.round(X + (X * (b - a)) / 100))], r),
      explanation: `The two changes multiply: (${100 + a}/100) × (${100 - b}/100) = ${(100 + a) * (100 - b) / 10000}. So original = ${X} ÷ ${(100 + a) * (100 - b) / 10000} = ${fmt(O)}.`,
      verified: (O * (100 + a)) / 100 * (100 - b) / 100 === X, seconds: secs(t) + 20,
    };
  },
};

// ---- Ratio -----------------------------------------------------------------------------------
const ratio: Gen = {
  id: 'quant-ratio', genre: 'quant', skill: 'Ratio and sharing', tiers: [1, 2, 3],
  make(r, t) {
    if (t === 1) {
      const [a, b] = pick(r, [[2, 3], [3, 5], [1, 4], [2, 5], [3, 4], [4, 7]]);
      const k = ri(r, 3, 15) * 5;
      const T = (a + b) * k;
      const ans = b * k;
      return {
        prompt: `${money(T * 10)} is shared between Asha and Ravi in the ratio ${a}:${b}. How much does Ravi get?`,
        correct: money(ans * 10), wrongs: wrongOptions(money(ans * 10), [money(a * k * 10), money((T * 10) / b), money((T * 10) / 2)], r),
        explanation: `${a + b} parts = ${money(T * 10)}, so 1 part = ${money(k * 10)}. Ravi gets ${b} parts = ${money(ans * 10)}.`,
        verified: (T * 10 * b) / (a + b) === ans * 10, seconds: secs(t),
      };
    }
    if (t === 2) {
      const [a, b, c] = pick(r, [[2, 3, 5], [1, 3, 4], [3, 4, 5], [2, 5, 7], [1, 2, 6]]);
      const k = ri(r, 3, 14);
      const T = (a + b + c) * k;
      const diff = (c - a) * k;
      return {
        prompt: `A prize of ${money(T * 10)} is divided among three players in the ratio ${a}:${b}:${c}. How much more does the biggest share get than the smallest?`,
        correct: money(diff * 10), wrongs: wrongOptions(money(diff * 10), [money(c * k * 10), money((c - b) * k * 10), money((T * 10) / (c - a))], r),
        explanation: `${a + b + c} parts = ${money(T * 10)}, so 1 part = ${money(k * 10)}. Difference = (${c} − ${a}) parts = ${money(diff * 10)}.`,
        verified: ((T * c) / (a + b + c) - (T * a) / (a + b + c)) * 10 === diff * 10, seconds: secs(t),
      };
    }
    const { a, b, k, x } = until(r, () => ({ a: ri(r, 2, 7), b: ri(r, 2, 9), k: ri(r, 3, 12), x: ri(r, 6, 40) }), (v) => {
      const B = v.a * v.k, G = v.b * v.k + v.x;
      const g = (p: number, q: number): number => (q === 0 ? p : g(q, p % q));
      const d = g(B, G);
      return v.a !== v.b && B / d !== v.a / g(v.a, v.b) && B / d <= 30 && G / d <= 30 && B / d !== G / d;
    });
    const B = a * k, G = b * k;
    const g = (p: number, q: number): number => (q === 0 ? p : g(q, p % q));
    const d = g(B, G + x);
    const c = B / d, dd = (G + x) / d;
    return {
      prompt: `In a club, boys and girls are in the ratio ${a}:${b}. When ${x} more girls join, the ratio becomes ${c}:${dd}. How many members did the club have at first?`,
      correct: fmt((a + b) * k), wrongs: wrongOptions(fmt((a + b) * k), [fmt(B + G + x), fmt((a + b) * k + x), fmt(B + G - x)], r),
      explanation: `Boys = ${a}k and girls = ${b}k. After ${x} girls join, ${a}k / (${b}k + ${x}) = ${c}/${dd}, which gives k = ${k}. So the club had (${a} + ${b}) × ${k} = ${(a + b) * k} members.`,
      verified: B * dd === c * (G + x), seconds: secs(t) + 30,
    };
  },
};

// ---- Time and work ---------------------------------------------------------------------------
const TRIPLES: [number, number, number][] = [];
for (let a = 6; a <= 60; a++) for (let b = a + 1; b <= 60; b++) for (let c = 6; c <= 60; c++) {
  if (c === a || c === b) continue;
  if ((a * b) % (a + b) === 0 && (b * c) % (b + c) === 0 && (c * a) % (c + a) === 0) TRIPLES.push([a, b, c]);
}

const work: Gen = {
  id: 'quant-work', genre: 'quant', skill: 'Time and work', tiers: [1, 2, 3],
  make(r, t) {
    if (t === 1) {
      const { a, b } = until(r, () => ({ a: ri(r, 6, 40), b: ri(r, 6, 40) }), (v) => v.a !== v.b && (v.a * v.b) % (v.a + v.b) === 0);
      const ans = (a * b) / (a + b);
      return {
        prompt: `Amit can finish a job in ${a} days and Bina can finish it in ${b} days. Working together, how many days do they need?`,
        correct: days(ans), wrongs: wrongOptions(days(ans), [days((a + b) / 2), days(a + b), days(Math.abs(a - b))], r),
        explanation: `Daily work = 1/${a} + 1/${b} = ${a + b}/${a * b}. Time = ${a * b}/${a + b} = ${ans} days.`,
        verified: ans * (a + b) === a * b, seconds: secs(t),
      };
    }
    if (t === 2) {
      const { tt, a } = until(r, () => ({ tt: ri(r, 4, 20), a: ri(r, 8, 60) }), (v) => v.a > v.tt && (v.tt * v.a) % (v.a - v.tt) === 0 && v.tt * v.a / (v.a - v.tt) !== v.a);
      const b = (tt * a) / (a - tt);
      return {
        prompt: `Two machines together complete an order in ${tt} days. The first machine alone needs ${a} days. How many days would the second machine alone need?`,
        correct: days(b), wrongs: wrongOptions(days(b), [days(a - tt), days(a + tt), days(tt * 2)], r),
        explanation: `Second machine's daily work = 1/${tt} − 1/${a} = ${a - tt}/${tt * a}. So it needs ${tt * a}/${a - tt} = ${b} days.`,
        verified: Math.abs(1 / tt - 1 / a - 1 / b) < 1e-12, seconds: secs(t),
      };
    }
    const [a, b, c] = pick(r, TRIPLES);
    const ab = (a * b) / (a + b), bc = (b * c) / (b + c), ca = (c * a) / (c + a);
    return {
      prompt: `A and B together finish a task in ${ab} days, B and C together in ${bc} days, and C and A together in ${ca} days. How many days would A alone need?`,
      correct: days(a), wrongs: wrongOptions(days(a), [days(b), days(c), days(ab + ca - bc)], r),
      explanation: `Add the three daily rates: 2(A+B+C) = 1/${ab} + 1/${bc} + 1/${ca}. Subtract B and C's rate (1/${bc}) to get 2A, so A's rate is 1/${a}. A alone needs ${a} days.`,
      verified: Math.abs(1 / ab + 1 / bc + 1 / ca - 2 * (1 / a + 1 / b + 1 / c)) < 1e-12, seconds: secs(t) + 30,
    };
  },
};

// ---- Speed -----------------------------------------------------------------------------------
const speed: Gen = {
  id: 'quant-speed', genre: 'quant', skill: 'Speed and distance', tiers: [1, 2, 3],
  make(r, t) {
    if (t === 1) {
      const v = pick(r, [18, 36, 54, 72, 90, 108]);
      const ans = (v * 5) / 18;
      return {
        prompt: `A cyclist rides at ${v} km/h. What is this speed in metres per second?`,
        correct: `${fmt(ans)} m/s`, wrongs: wrongOptions(`${fmt(ans)} m/s`, [`${fmt((v * 18) / 5)} m/s`, `${fmt(v / 3.6 + 2)} m/s`, `${fmt(v / 6)} m/s`], r),
        explanation: `Multiply km/h by 5/18: ${v} × 5/18 = ${ans} m/s.`, verified: (ans * 3600) / 1000 === v, seconds: secs(t),
      };
    }
    if (t === 2) {
      const { v1, v2, L1, L2 } = until(r, () => ({ v1: ri(r, 6, 60), v2: ri(r, 6, 60), L1: ri(r, 6, 30) * 10, L2: ri(r, 6, 30) * 10 }), (v) => {
        const s = v.v1 + v.v2;
        if (s % 18 !== 0) return false;
        const u = (s / 18) * 5;
        return (v.L1 + v.L2) % u === 0 && (v.L1 + v.L2) / u >= 4;
      });
      const u = ((v1 + v2) / 18) * 5;
      const time = (L1 + L2) / u;
      return {
        prompt: `Two trains of lengths ${L1} m and ${L2} m run towards each other on parallel tracks at ${v1} km/h and ${v2} km/h. How many seconds do they take to cross each other completely?`,
        correct: `${fmt(time)} seconds`, wrongs: wrongOptions(`${fmt(time)} seconds`, [`${fmt((L1 + L2) / (Math.abs(v1 - v2) * 5 / 18 || 1))} seconds`, `${fmt((L1 + L2) / (v1 + v2))} seconds`, `${fmt(L1 / u)} seconds`], r),
        explanation: `Coming towards each other, speeds add: ${v1 + v2} km/h = ${u} m/s. Distance to cover = ${L1} + ${L2} = ${L1 + L2} m. Time = ${L1 + L2} ÷ ${u} = ${fmt(time)} s.`,
        verified: Math.abs(time * (((v1 + v2) * 1000) / 3600) - (L1 + L2)) < 1e-9, seconds: secs(t),
      };
    }
    const { d1, v1, d2, v2 } = until(r, () => ({ d1: ri(r, 3, 15) * 20, v1: pick(r, [20, 30, 40, 60]), d2: ri(r, 3, 15) * 20, v2: pick(r, [30, 40, 50, 60, 80]) }), (v) => {
      const tt = v.d1 / v.v1 + v.d2 / v.v2;
      const avg = (v.d1 + v.d2) / tt;
      return v.v1 !== v.v2 && Number.isInteger(avg) && Number.isInteger(v.d1 / v.v1) && Number.isInteger(v.d2 / v.v2);
    });
    const avg = (d1 + d2) / (d1 / v1 + d2 / v2);
    return {
      prompt: `A bus travels ${d1} km at ${v1} km/h and then another ${d2} km at ${v2} km/h. What is its average speed for the whole journey?`,
      correct: `${fmt(avg)} km/h`, wrongs: wrongOptions(`${fmt(avg)} km/h`, [`${fmt((v1 + v2) / 2)} km/h`, `${fmt((2 * v1 * v2) / (v1 + v2))} km/h`, `${fmt(Math.sqrt(v1 * v2))} km/h`], r),
      explanation: `Total distance = ${d1 + d2} km. Time = ${d1}/${v1} + ${d2}/${v2} = ${fmt(d1 / v1 + d2 / v2)} h. Average = ${d1 + d2} ÷ ${fmt(d1 / v1 + d2 / v2)} = ${avg} km/h (not the simple mean of the speeds).`,
      verified: Math.abs(avg * (d1 / v1 + d2 / v2) - (d1 + d2)) < 1e-9, seconds: secs(t) + 20,
    };
  },
};

// ---- Profit and loss -------------------------------------------------------------------------
const profit: Gen = {
  id: 'quant-profit', genre: 'quant', skill: 'Profit and loss', tiers: [1, 2, 3],
  make(r, t) {
    const label = (x: number) => (x >= 0 ? `${fmt(x)}% profit` : `${fmt(-x)}% loss`);
    if (t === 1) {
      const { cp, sp } = until(r, () => ({ cp: ri(r, 5, 40) * 20, sp: ri(r, 4, 60) * 20 }), (v) => ((v.sp - v.cp) * 100) % v.cp === 0 && v.sp !== v.cp);
      const pc = ((sp - cp) * 100) / cp;
      return {
        prompt: `A trader buys a lamp for ${money(cp)} and sells it for ${money(sp)}. What is the profit or loss percentage?`,
        correct: label(pc), wrongs: wrongOptions(label(pc), [label(-pc), label(((sp - cp) * 100) / sp), label(sp - cp)], r),
        explanation: `Change = ${money(sp - cp)} on a cost of ${money(cp)}, so ${fmt(Math.abs(pc))}% ${pc >= 0 ? 'profit' : 'loss'} (always measured on cost price).`,
        verified: Math.abs(cp * (1 + pc / 100) - sp) < 1e-9, seconds: secs(t),
      };
    }
    if (t === 2) {
      const { m, d } = until(r, () => ({ m: pick(r, [20, 25, 30, 40, 50, 60]), d: pick(r, [10, 15, 20, 25, 30]) }), (v) => ((100 + v.m) * (100 - v.d)) % 100 === 0 && (100 + v.m) * (100 - v.d) !== 10000);
      const net = ((100 + m) * (100 - d)) / 100 - 100;
      return {
        prompt: `A shopkeeper marks goods ${m}% above cost and then allows a discount of ${d}% on the marked price. What is his overall profit or loss percentage?`,
        correct: label(net), wrongs: wrongOptions(label(net), [label(m - d), label(m + d), label(-net)], r),
        explanation: `Take cost = 100. Marked = ${100 + m}. Selling = ${100 + m} × ${100 - d}/100 = ${fmt(((100 + m) * (100 - d)) / 100)}. That is ${label(net)} on cost.`,
        verified: Math.abs((100 * (1 + m / 100)) * (1 - d / 100) - (100 + net)) < 1e-9, seconds: secs(t),
      };
    }
    const p = pick(r, [10, 20, 30, 40]);
    const X = ri(r, 3, 12) * 120;
    const cp1 = X / (1 + p / 100), cp2 = X / (1 - p / 100);
    const net = ((2 * X - (cp1 + cp2)) * 100) / (cp1 + cp2);
    return {
      prompt: `Two articles are each sold for ${money(X)}. One is sold at a ${p}% profit and the other at a ${p}% loss. What is the overall result on the whole transaction?`,
      correct: label(net), wrongs: wrongOptions(label(net), ['No profit, no loss', label(p), label(-net)], r),
      explanation: `Costs are ${money(X)}/(1+${p / 100}) and ${money(X)}/(1−${p / 100}). Equal selling prices with equal percent gain and loss always produce a loss of p²/100 = ${p * p / 100}%.`,
      verified: Math.abs(net + (p * p) / 100) < 1e-9, seconds: secs(t) + 20,
    };
  },
};

// ---- Mixtures --------------------------------------------------------------------------------
const mixture: Gen = {
  id: 'quant-mixture', genre: 'quant', skill: 'Mixtures', tiers: [2, 3],
  make(r, t) {
    if (t === 2) {
      const g = (p: number, q: number): number => (q === 0 ? p : g(q, p % q));
      const { c1, c2, m } = until(r, () => ({ c1: ri(r, 20, 80), c2: ri(r, 90, 200), m: ri(r, 30, 150) }), (v) => v.m > v.c1 && v.m < v.c2 && v.c1 !== v.m && v.c2 !== v.m);
      const x = c2 - m, y = m - c1, d = g(x, y);
      const ans = `${x / d} : ${y / d}`;
      return {
        prompt: `Rice at ${money(c1)} per kg is mixed with rice at ${money(c2)} per kg so that the mixture is worth ${money(m)} per kg. In what ratio (cheaper : dearer) must they be mixed?`,
        correct: ans, wrongs: [`${y / d} : ${x / d}`, `${(c2 - c1) / g(c2 - c1, m)} : ${m / g(c2 - c1, m)}`, `${c1 / g(c1, c2)} : ${c2 / g(c1, c2)}`].filter((o) => o !== ans),
        explanation: `Alligation: cheaper : dearer = (dearer − mean) : (mean − cheaper) = (${c2} − ${m}) : (${m} − ${c1}) = ${x} : ${y} = ${ans}.`,
        verified: (x / d) * c1 + (y / d) * c2 === (x / d + y / d) * m, seconds: secs(t) + 10,
      };
    }
    const { Q, rr } = until(r, () => ({ Q: pick(r, [20, 40, 50, 60, 80, 100, 120]), rr: ri(r, 2, 30) }), (v) => v.rr < v.Q && ((v.Q - v.rr) * (v.Q - v.rr)) % v.Q === 0);
    const left = ((Q - rr) * (Q - rr)) / Q;
    const m1 = Q - rr;
    const m2 = m1 - (rr * m1) / Q;
    return {
      prompt: `A vessel holds ${Q} litres of pure milk. ${rr} litres are drawn out and replaced with water, and then ${rr} litres of the mixture are drawn out and replaced with water again. How many litres of milk remain?`,
      correct: `${fmt(left)} litres`, wrongs: wrongOptions(`${fmt(left)} litres`, [`${fmt(Q - 2 * rr)} litres`, `${fmt(Q - rr)} litres`, `${fmt(Q * Math.pow(1 - rr / Q, 3))} litres`], r),
      explanation: `Each replacement keeps ${Q - rr}/${Q} of the milk. After two: ${Q} × (${Q - rr}/${Q})² = ${fmt(left)} litres.`,
      verified: Math.abs(m2 - left) < 1e-9, seconds: secs(t) + 20,
    };
  },
};

export const QUANT_GENS: Gen[] = [percent, ratio, work, speed, profit, mixture];
export type { Draft, Rng, Tier };
