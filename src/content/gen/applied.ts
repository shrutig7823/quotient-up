import { type Gen, fmt, money, pick, ri, secs, until, wrongOptions } from './kit';

// ---- Break-even ------------------------------------------------------------------------------
const breakEven: Gen = {
  id: 'applied-breakeven', genre: 'applied', skill: 'Break-even', tiers: [1, 2, 3],
  make(r, t) {
    const { price, vc, units } = until(r, () => ({ price: ri(r, 20, 90) * 5, vc: ri(r, 5, 60) * 5, units: ri(r, 8, 60) * 5 }), (v) => v.price > v.vc + 10);
    const margin = price - vc;
    const F = margin * units;
    if (t === 1) {
      return {
        prompt: `A bakery has fixed costs of ${money(F)} a month. Each cake sells for ${money(price)} and costs ${money(vc)} to make. How many cakes must it sell each month to break even?`,
        correct: String(units), wrongs: wrongOptions(String(units), [String(Math.round(F / price)), String(Math.round(F / vc)), String(Math.round(F / (price + vc)))], r),
        explanation: `Each cake contributes ${money(price)} − ${money(vc)} = ${money(margin)}. Break-even = ${money(F)} ÷ ${money(margin)} = ${units} cakes.`,
        verified: units * price - (F + units * vc) === 0, seconds: secs(t),
      };
    }
    if (t === 2) {
      const target = margin * ri(r, 5, 40);
      const need = (F + target) / margin;
      return {
        prompt: `A workshop has fixed costs of ${money(F)}. Each item sells for ${money(price)} with a variable cost of ${money(vc)}. How many items must it sell to earn a profit of ${money(target)}?`,
        correct: fmt(need), wrongs: wrongOptions(fmt(need), [String(units), fmt(target / margin), fmt((F + target) / price)], r),
        explanation: `Profit = contribution × units − fixed cost. So units = (${money(F)} + ${money(target)}) ÷ ${money(margin)} = ${fmt(need)}.`,
        verified: Math.abs(need * price - (F + need * vc) - target) < 1e-6, seconds: secs(t) + 10,
      };
    }
    // Draw the whole scenario again until the discounted break-even is a whole number of units.
    const s = until(r, () => {
      const pr = ri(r, 20, 90) * 5, v = ri(r, 5, 60) * 5, u = ri(r, 8, 60) * 5;
      const m = pr - v, c = ri(r, 2, 30);
      return { pr, v, u, m, c, F2: m * u };
    }, (x) => x.m > 12 && x.c < x.m && x.F2 % (x.m - x.c) === 0 && x.F2 / (x.m - x.c) !== x.u);
    const n2 = s.F2 / (s.m - s.c);
    return {
      prompt: `A firm has fixed costs of ${money(s.F2)}. It sells at ${money(s.pr)} per unit with variable cost ${money(s.v)}. A discount of ${money(s.c)} per unit is introduced. How many units must it now sell to break even?`,
      correct: fmt(n2), wrongs: wrongOptions(fmt(n2), [String(s.u), fmt(s.F2 / s.c), fmt(s.F2 / (s.m + s.c))], r),
      explanation: `The new contribution is ${money(s.m)} − ${money(s.c)} = ${money(s.m - s.c)} per unit. Break-even = ${money(s.F2)} ÷ ${money(s.m - s.c)} = ${fmt(n2)} units.`,
      verified: Math.abs(n2 * (s.pr - s.c) - s.F2 - n2 * s.v) < 1e-6, seconds: secs(t) + 20,
    };
  },
};

// ---- Bottlenecks -----------------------------------------------------------------------------
const bottleneck: Gen = {
  id: 'applied-bottleneck', genre: 'applied', skill: 'Capacity bottlenecks', tiers: [1, 2, 3],
  make(r, t) {
    if (t === 1) {
      const caps = [ri(r, 8, 30) * 10, ri(r, 8, 30) * 10, ri(r, 8, 30) * 10];
      const min = Math.min(...caps);
      const N = min * ri(r, 3, 9);
      return {
        prompt: `A factory line has three stages that can process ${caps[0]}, ${caps[1]} and ${caps[2]} units per hour. Every unit must pass all three. How many hours does it take to finish ${N} units (ignore start-up time)?`,
        correct: `${fmt(N / min)} hours`, wrongs: wrongOptions(`${fmt(N / min)} hours`, [`${fmt(N / Math.max(...caps))} hours`, `${fmt(N / (caps.reduce((a, b) => a + b, 0) / 3))} hours`, `${fmt(N / caps.reduce((a, b) => a + b, 0))} hours`], r),
        explanation: `The slowest stage limits the line: ${min} units per hour. Time = ${N} ÷ ${min} = ${fmt(N / min)} hours.`,
        verified: caps.every((c) => c >= min) && caps.includes(min), seconds: secs(t),
      };
    }
    const mach = [ri(r, 2, 6), ri(r, 2, 6), ri(r, 2, 6)];
    const rate = [ri(r, 3, 10) * 5, ri(r, 3, 10) * 5, ri(r, 3, 10) * 5];
    const cap = mach.map((m, i) => m * rate[i]);
    const min = Math.min(...cap);
    if (t === 2) {
      return {
        prompt: `A line has three stages. Stage 1 has ${mach[0]} machines at ${rate[0]} units/hour each, Stage 2 has ${mach[1]} machines at ${rate[1]} each, Stage 3 has ${mach[2]} machines at ${rate[2]} each. What is the maximum output of the whole line per hour?`,
        correct: String(min), wrongs: wrongOptions(String(min), [String(Math.max(...cap)), String(Math.round(cap.reduce((a, b) => a + b, 0) / 3)), String(cap.reduce((a, b) => a + b, 0))], r),
        explanation: `Stage capacities: ${cap.join(', ')}. The line can only run as fast as its slowest stage: ${min} units per hour.`,
        verified: cap.filter((c) => c < min).length === 0, seconds: secs(t) + 10,
      };
    }
    const slow = cap.indexOf(min);
    const cap2 = cap.map((c, i) => (i === slow ? c + rate[i] : c));
    const newMin = Math.min(...cap2);
    return {
      prompt: `A line has three stages. Stage 1 has ${mach[0]} machines at ${rate[0]} units/hour each, Stage 2 has ${mach[1]} machines at ${rate[1]} each, Stage 3 has ${mach[2]} machines at ${rate[2]} each. One extra machine is added to the slowest stage. What is the new maximum output per hour?`,
      correct: String(newMin), wrongs: wrongOptions(String(newMin), [String(min + rate[slow]), String(Math.max(...cap2)), String(min)], r),
      explanation: `Capacities start at ${cap.join(', ')}; the slowest (${min}) rises by ${rate[slow]} to ${cap2[slow]}. The line is now limited by ${newMin}, which may be a different stage.`,
      verified: Math.min(...cap.map((c, i) => (i === slow ? c + rate[i] : c))) === newMin, seconds: secs(t) + 20,
    };
  },
};

// ---- Expected cost ---------------------------------------------------------------------------
const expected: Gen = {
  id: 'applied-expected', genre: 'applied', skill: 'Expected cost', tiers: [1, 2, 3],
  make(r, t) {
    const lab = (x: number) => money(x);
    if (t === 1) {
      const { price, p, pen } = until(r, () => ({ price: ri(r, 5, 40) * 10, p: pick(r, [5, 10, 20, 25, 40]), pen: ri(r, 2, 20) * 50 }), (v) => (v.p * v.pen) % 100 === 0);
      const exp = price + (p * pen) / 100;
      return {
        prompt: `A part costs ${lab(price)}. It fails with a probability of ${p}%, and each failure costs ${lab(pen)} to fix. What is the expected total cost per part?`,
        correct: lab(exp), wrongs: wrongOptions(lab(exp), [lab(price + pen), lab(price), lab(price + p)], r),
        explanation: `Expected repair cost = ${p}% × ${lab(pen)} = ${lab((p * pen) / 100)}. Expected total = ${lab(price)} + ${lab((p * pen) / 100)} = ${lab(exp)}.`,
        verified: Math.abs(price * 1 + (p / 100) * pen + (1 - p / 100) * 0 - exp) < 1e-9, seconds: secs(t) + 10,
      };
    }
    const mk = () => ({ price: ri(r, 6, 30) * 10, p: pick(r, [5, 10, 20, 25]) });
    const { A, B, pen } = until(r, () => ({ A: mk(), B: mk(), pen: ri(r, 2, 12) * 100 }), (v) => {
      const ea = v.A.price + (v.A.p * v.pen) / 100, eb = v.B.price + (v.B.p * v.pen) / 100;
      return ea !== eb && v.A.price < v.B.price && v.A.p > v.B.p && (v.A.p * v.pen) % 100 === 0 && (v.B.p * v.pen) % 100 === 0;
    });
    const ea = A.price + (A.p * pen) / 100, eb = B.price + (B.p * pen) / 100;
    const best = Math.min(ea, eb);
    if (t === 2) {
      return {
        prompt: `Supplier X charges ${lab(A.price)} per unit with a ${A.p}% failure chance. Supplier Y charges ${lab(B.price)} with a ${B.p}% failure chance. Each failure costs ${lab(pen)} extra. What is the lower expected cost per unit?`,
        correct: lab(best), wrongs: wrongOptions(lab(best), [lab(Math.max(ea, eb)), lab(A.price), lab(B.price)], r),
        explanation: `X: ${lab(A.price)} + ${A.p}% × ${lab(pen)} = ${lab(ea)}. Y: ${lab(B.price)} + ${B.p}% × ${lab(pen)} = ${lab(eb)}. The lower is ${lab(best)}.`,
        verified: Math.abs(best - Math.min(A.price + (A.p / 100) * pen, B.price + (B.p / 100) * pen)) < 1e-9, seconds: secs(t) + 20,
      };
    }
    const qty = ri(r, 4, 30) * 10;
    return {
      prompt: `An order needs ${qty} units. Supplier X charges ${lab(A.price)} per unit with a ${A.p}% failure chance; Supplier Y charges ${lab(B.price)} with a ${B.p}% failure chance. Each failed unit costs ${lab(pen)} extra. How much less is the expected total for the better supplier compared with the other?`,
      correct: lab(Math.abs(ea - eb) * qty), wrongs: wrongOptions(lab(Math.abs(ea - eb) * qty), [lab(Math.abs(A.price - B.price) * qty), lab(Math.abs(ea - eb)), lab((ea + eb) * qty)], r),
      explanation: `Per unit: X = ${lab(ea)}, Y = ${lab(eb)}. Difference ${lab(Math.abs(ea - eb))} × ${qty} units = ${lab(Math.abs(ea - eb) * qty)}.`,
      verified: Math.abs(Math.abs(ea - eb) * qty - Math.abs((A.price * qty + (A.p / 100) * pen * qty) - (B.price * qty + (B.p / 100) * pen * qty))) < 1e-6, seconds: secs(t) + 30,
    };
  },
};

// ---- Scheduling ------------------------------------------------------------------------------
const scheduling: Gen = {
  id: 'applied-scheduling', genre: 'applied', skill: 'Scheduling', tiers: [1, 2, 3],
  make(r, t) {
    if (t === 1) {
      const d = Array.from({ length: 4 }, () => ri(r, 2, 9) * 5);
      const tot = d.reduce((a, b) => a + b, 0);
      return {
        prompt: `One technician must complete four jobs of ${d.join(', ')} minutes, one after another with no breaks. How long does it take in total?`,
        correct: `${tot} minutes`, wrongs: wrongOptions(`${tot} minutes`, [`${Math.max(...d)} minutes`, `${tot - Math.min(...d)} minutes`, `${Math.round(tot / 2)} minutes`], r),
        explanation: `${d.join(' + ')} = ${tot} minutes.`, verified: d.reduce((a, b) => a + b, 0) === tot, seconds: secs(t),
      };
    }
    const n = t === 2 ? 4 : 6;
    const d = until(r, () => Array.from({ length: n }, () => ri(r, 2, 12)), (x) => new Set(x).size >= n - 1);
    // Brute force over every split between two workers.
    let best = Infinity;
    for (let mask = 0; mask < 1 << n; mask++) {
      let a = 0, b = 0;
      d.forEach((v, i) => ((mask >> i) & 1 ? (a += v) : (b += v)));
      best = Math.min(best, Math.max(a, b));
    }
    const tot = d.reduce((a, b) => a + b, 0);
    // Second method: the best split is the largest subset sum not above half the total.
    let reach = new Set<number>([0]);
    d.forEach((v) => (reach = new Set([...reach, ...[...reach].map((x) => x + v)])));
    const half = Math.max(...[...reach].filter((x) => x <= tot / 2));
    return {
      prompt: `Two workers share ${n} jobs that take ${d.join(', ')} hours each. Each job is done by one worker without interruption, and both start together. What is the shortest possible time until all jobs are finished?`,
      correct: `${best} hours`, wrongs: wrongOptions(`${best} hours`, [`${Math.ceil(tot / 2) === best ? best + 1 : Math.ceil(tot / 2)} hours`, `${Math.max(...d)} hours`, `${tot} hours`, `${best + 2} hours`], r),
      explanation: `Total work = ${tot} hours, so the best possible is about ${fmt(tot / 2)} each. Trying every split, the smallest finishing time is ${best} hours (one worker takes jobs adding to ${half}, the other ${tot - half}).`,
      verified: best === tot - half, seconds: secs(t) + (t === 3 ? 60 : 20),
    };
  },
};

export const APPLIED_GENS: Gen[] = [breakEven, bottleneck, expected, scheduling];
