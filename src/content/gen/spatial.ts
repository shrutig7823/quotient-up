import { type Gen, type Tier, pick, ri, secs, until, wrongOptions } from './kit';

type P = [number, number];
type Op = { name: string; f: (p: P) => P; m: [[number, number], [number, number]] };

// Each operation is written twice: as a coordinate rule and as a 2x2 matrix, so one checks the other.
const OPS: Op[] = [
  { name: 'rotated 90° anticlockwise about the origin', f: ([x, y]) => [-y, x], m: [[0, -1], [1, 0]] },
  { name: 'rotated 90° clockwise about the origin', f: ([x, y]) => [y, -x], m: [[0, 1], [-1, 0]] },
  { name: 'rotated 180° about the origin', f: ([x, y]) => [-x, -y], m: [[-1, 0], [0, -1]] },
  { name: 'reflected in the x-axis', f: ([x, y]) => [x, -y], m: [[1, 0], [0, -1]] },
  { name: 'reflected in the y-axis', f: ([x, y]) => [-x, y], m: [[-1, 0], [0, 1]] },
  { name: 'reflected in the line y = x', f: ([x, y]) => [y, x], m: [[0, 1], [1, 0]] },
];
const mul = (m: Op['m'], [x, y]: P): P => [m[0][0] * x + m[0][1] * y, m[1][0] * x + m[1][1] * y];
const show = ([x, y]: P) => `(${x}, ${y})`;

const transform: Gen = {
  id: 'spatial-transform', genre: 'spatial', skill: 'Rotation and reflection', tiers: [1, 2, 3],
  make(r, t) {
    const count = t;
    const ops = until(r, () => Array.from({ length: count }, () => pick(r, OPS)), (o) => o.every((x, i) => i === 0 || x !== o[i - 1]));
    const start = until(r, () => [ri(r, -6, 6), ri(r, -6, 6)] as P, (p) => p[0] !== 0 && p[1] !== 0 && Math.abs(p[0]) !== Math.abs(p[1]));
    let cur: P = start;
    for (const o of ops) cur = o.f(cur);
    let viaMatrix: P = start;
    for (const o of ops) viaMatrix = mul(o.m, viaMatrix);
    const ans = show(cur);
    let rev: P = start;
    for (const o of [...ops].reverse()) rev = o.f(rev);
    const swapped: P = [cur[1], cur[0]];
    const flipped: P = [-cur[0], -cur[1]];
    const steps = ops.map((o) => o.name).join(', then ');
    return {
      prompt: `The point P(${start[0]}, ${start[1]}) is ${steps}. What are the coordinates of the final point?`,
      correct: ans, wrongs: wrongOptions(ans, [show(rev), show(swapped), show(flipped), show([cur[0], -cur[1]])], r),
      explanation: `Apply the moves in order: ${(() => { let c: P = start; return ops.map((o) => { c = o.f(c); return `${o.name} → ${show(c)}`; }).join('; '); })()}.`,
      verified: viaMatrix[0] === cur[0] && viaMatrix[1] === cur[1], seconds: secs(t) + 10,
    };
  },
};

// Count monotone lattice routes by dynamic programming.
function routes(R: number, C: number, blocked: [number, number][]): number {
  const dp: number[][] = Array.from({ length: R + 1 }, () => Array(C + 1).fill(0));
  const isB = (i: number, j: number) => blocked.some(([bi, bj]) => bi === i && bj === j);
  dp[0][0] = 1;
  for (let i = 0; i <= R; i++) for (let j = 0; j <= C; j++) {
    if (i === 0 && j === 0) continue;
    if (isB(i, j)) { dp[i][j] = 0; continue; }
    dp[i][j] = (i > 0 ? dp[i - 1][j] : 0) + (j > 0 ? dp[i][j - 1] : 0);
  }
  return dp[R][C];
}
const choose = (n: number, k: number): number => { let v = 1; for (let i = 1; i <= k; i++) v = (v * (n - k + i)) / i; return Math.round(v); };

const grid: Gen = {
  id: 'spatial-routes', genre: 'spatial', skill: 'Grid routes', tiers: [1, 2, 3],
  make(r, t) {
    const R = t === 1 ? ri(r, 2, 3) : ri(r, 3, 5);
    const C = t === 1 ? ri(r, 3, 4) : ri(r, 4, 6);
    const base = `A robot walks along the lines of a grid with ${R} rows and ${C} columns of squares, from the top-left corner to the bottom-right corner, moving only right or down.`;
    if (t === 1) {
      const ans = routes(R, C, []);
      return {
        prompt: `${base} How many different routes are there?`,
        correct: String(ans), wrongs: wrongOptions(String(ans), [String(R * C), String(R + C), String(ans + R)], r),
        explanation: `Every route has ${R} downs and ${C} rights in some order: C(${R + C}, ${R}) = ${ans}.`, verified: ans === choose(R + C, R), seconds: secs(t) + 20,
      };
    }
    const b1: [number, number] = [ri(r, 1, R - 1), ri(r, 1, C - 1)];
    if (t === 2) {
      const ans = routes(R, C, [b1]);
      const through = choose(b1[0] + b1[1], b1[0]) * choose(R - b1[0] + C - b1[1], R - b1[0]);
      return {
        prompt: `${base} The junction ${b1[0]} step${b1[0] > 1 ? 's' : ''} down and ${b1[1]} step${b1[1] > 1 ? 's' : ''} right of the start is blocked. How many different routes are there?`,
        correct: String(ans), wrongs: wrongOptions(String(ans), [String(routes(R, C, [])), String(through), String(routes(R, C, []) + through)], r),
        explanation: `Total routes without the block = ${choose(R + C, R)}. Routes that pass through the blocked junction = ${choose(b1[0] + b1[1], b1[0])} × ${choose(R - b1[0] + C - b1[1], R - b1[0])} = ${through}. Allowed = ${choose(R + C, R)} − ${through} = ${ans}.`,
        verified: ans === choose(R + C, R) - through, seconds: secs(t) + 30,
      };
    }
    const b2 = until(r, () => [ri(r, 1, R - 1), ri(r, 1, C - 1)] as [number, number], (b) => !(b[0] === b1[0] && b[1] === b1[1]));
    const ans = routes(R, C, [b1, b2]);
    const f = (a: [number, number], b: [number, number]) => (b[0] >= a[0] && b[1] >= a[1] ? choose(b[0] - a[0] + b[1] - a[1], b[0] - a[0]) : 0);
    const o: [number, number] = [0, 0], e: [number, number] = [R, C];
    const thr = (b: [number, number]) => f(o, b) * f(b, e);
    const both = (a: [number, number], b: [number, number]) => f(o, a) * f(a, b) * f(b, e);
    const incl = choose(R + C, R) - thr(b1) - thr(b2) + both(b1, b2) + both(b2, b1);
    return {
      prompt: `${base} The junctions ${b1[0]} down, ${b1[1]} right and ${b2[0]} down, ${b2[1]} right are both blocked. How many different routes are there?`,
      correct: String(ans), wrongs: wrongOptions(String(ans), [String(routes(R, C, [b1])), String(routes(R, C, [b2])), String(routes(R, C, []))], r),
      explanation: `Count all routes, then remove those through either blocked junction (adding back any counted twice): ${choose(R + C, R)} − ${thr(b1)} − ${thr(b2)} + ${both(b1, b2) + both(b2, b1)} = ${ans}.`,
      verified: ans === incl, seconds: secs(t) + 40,
    };
  },
};

const cube: Gen = {
  id: 'spatial-cube', genre: 'spatial', skill: 'Painted cubes', tiers: [1, 2, 3],
  make(r, t) {
    const n = t === 1 ? ri(r, 3, 4) : t === 2 ? ri(r, 4, 5) : ri(r, 5, 7);
    const k = t === 1 ? pick(r, [3, 2]) : t === 2 ? pick(r, [2, 1]) : pick(r, [1, 0]);
    // Brute force: count faces on the boundary for every unit cube.
    const painted = (x: number, y: number, z: number) => [x, y, z].filter((c) => c === 0 || c === n - 1).length;
    let count = 0;
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) if (painted(x, y, z) === k) count++;
    const formula = k === 3 ? 8 : k === 2 ? 12 * (n - 2) : k === 1 ? 6 * (n - 2) ** 2 : (n - 2) ** 3;
    const word = k === 0 ? 'no faces painted' : `exactly ${k} face${k > 1 ? 's' : ''} painted`;
    return {
      prompt: `A solid wooden cube of side ${n} cm is painted on all six faces and then cut into ${n * n * n} unit cubes of side 1 cm. How many of the small cubes have ${word}?`,
      correct: String(formula), wrongs: wrongOptions(String(formula), [String(6 * (n - 2) ** 2), String(12 * (n - 2)), String((n - 2) ** 3), String(n * n * n - (n - 2) ** 3)], r),
      explanation: k === 3 ? 'Only the 8 corner cubes touch three faces.' : k === 2 ? `Each of the 12 edges has ${n - 2} cubes that are not corners: 12 × ${n - 2} = ${formula}.` : k === 1 ? `Each of the 6 faces has a (${n - 2}) × (${n - 2}) block of centre cubes: 6 × ${(n - 2) ** 2} = ${formula}.` : `The hidden inner cube is (${n} − 2)³ = ${formula}.`,
      verified: count === formula, seconds: secs(t as Tier) + 10,
    };
  },
};

export const SPATIAL_GENS: Gen[] = [transform, grid, cube];
