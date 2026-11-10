import { type Gen, fmt, money, pick, ri, secs, until, wrongOptions } from './kit';

const PRODUCTS = ['Alpha', 'Beta', 'Gamma'];
const Q = ['Q1', 'Q2', 'Q3', 'Q4'];
const pc = (x: number) => `${fmt(x)}%`;

const tableText = (title: string, rows: number[][]) =>
  `${title}\nProduct | ${Q.join(' | ')}\n${rows.map((row, i) => `${PRODUCTS[i]} | ${row.join(' | ')}`).join('\n')}`;

// ---- Reading a table -------------------------------------------------------------------------
const table: Gen = {
  id: 'data-table', genre: 'data', skill: 'Table reading', tiers: [1, 2, 3],
  make(r, t) {
    const draw = () => PRODUCTS.map(() => Q.map(() => ri(r, 10, 60)));
    const rows = draw();
    if (t === 1) {
      const p = ri(r, 0, 2);
      const total = rows[p].reduce((a, b) => a + b, 0);
      return {
        prompt: `${tableText('Units sold (in hundreds)', rows)}\n\nHow many hundreds of units of ${PRODUCTS[p]} were sold over the four quarters?`,
        correct: String(total), wrongs: wrongOptions(String(total), [String(total - rows[p][3]), String(total + rows[p][0]), String(Math.round(total / 4))], r),
        explanation: `${PRODUCTS[p]}: ${rows[p].join(' + ')} = ${total}.`, verified: Q.reduce((s, _, i) => s + rows[p][i], 0) === total, seconds: secs(t) + 10,
      };
    }
    if (t === 2) {
      // Draw whole tables until one has a rise that is a clean whole-number percentage.
      const found = until(r, () => {
        const rs = draw();
        const hits: { p: number; i: number }[] = [];
        rs.forEach((row, p) => row.slice(0, 3).forEach((a, i) => { const b = row[i + 1]; if (b > a && ((b - a) * 100) % a === 0) hits.push({ p, i }); }));
        return { rs, hits };
      }, (v) => v.hits.length > 0);
      const pick2 = pick(r, found.hits);
      const trows = found.rs;
      const a = trows[pick2.p][pick2.i], b = trows[pick2.p][pick2.i + 1];
      const inc = ((b - a) * 100) / a;
      return {
        prompt: `${tableText('Units sold (in hundreds)', trows)}\n\nBy what percentage did sales of ${PRODUCTS[pick2.p]} rise from ${Q[pick2.i]} to ${Q[pick2.i + 1]}?`,
        correct: pc(inc), wrongs: wrongOptions(pc(inc), [pc(b - a), pc(((b - a) * 100) / b), pc(inc + 10)], r),
        explanation: `Rise = ${b} − ${a} = ${b - a}. Percentage rise = ${b - a}/${a} × 100 = ${pc(inc)} (measured on the earlier quarter).`,
        verified: Math.abs(a * (1 + inc / 100) - b) < 1e-9, seconds: secs(t) + 10,
      };
    }
    const vv = until(r, () => ({ q: ri(r, 0, 3), p: ri(r, 0, 2), rows: PRODUCTS.map(() => Q.map(() => ri(r, 10, 60))) }), (v) => {
      const col = v.rows.reduce((s, row) => s + row[v.q], 0);
      return (v.rows[v.p][v.q] * 100) % col === 0;
    });
    const col = vv.rows.reduce((s, row) => s + row[vv.q], 0);
    const share = (vv.rows[vv.p][vv.q] * 100) / col;
    return {
      prompt: `${tableText('Units sold (in hundreds)', vv.rows)}\n\nWhat percentage of all ${Q[vv.q]} sales was ${PRODUCTS[vv.p]}?`,
      correct: pc(share), wrongs: wrongOptions(pc(share), [pc(vv.rows[vv.p][vv.q]), pc((vv.rows[vv.p][vv.q] * 100) / vv.rows[vv.p].reduce((a, b) => a + b, 0)), pc(100 - share)], r),
      explanation: `${Q[vv.q]} total = ${vv.rows.map((row) => row[vv.q]).join(' + ')} = ${col}. Share = ${vv.rows[vv.p][vv.q]}/${col} × 100 = ${pc(share)}.`,
      verified: Math.abs((share / 100) * col - vv.rows[vv.p][vv.q]) < 1e-9, seconds: secs(t) + 20,
    };
  },
};

// ---- Weighted averages -----------------------------------------------------------------------
const weighted: Gen = {
  id: 'data-weighted', genre: 'data', skill: 'Weighted averages', tiers: [1, 2, 3],
  make(r, t) {
    if (t === 1) {
      const { n1, m1, n2, m2 } = until(r, () => ({ n1: ri(r, 5, 30), m1: ri(r, 40, 90), n2: ri(r, 5, 30), m2: ri(r, 40, 90) }), (v) => (v.n1 * v.m1 + v.n2 * v.m2) % (v.n1 + v.n2) === 0 && v.m1 !== v.m2);
      const avg = (n1 * m1 + n2 * m2) / (n1 + n2);
      return {
        prompt: `Section A has ${n1} students with an average score of ${m1}. Section B has ${n2} students with an average of ${m2}. What is the average score of all ${n1 + n2} students?`,
        correct: fmt(avg), wrongs: wrongOptions(fmt(avg), [fmt((m1 + m2) / 2), fmt(avg + 2), fmt(avg - 2)], r),
        explanation: `Total marks = ${n1} × ${m1} + ${n2} × ${m2} = ${n1 * m1 + n2 * m2}. Average = ${n1 * m1 + n2 * m2} ÷ ${n1 + n2} = ${fmt(avg)}.`,
        verified: Math.abs(avg * (n1 + n2) - (n1 * m1 + n2 * m2)) < 1e-9, seconds: secs(t),
      };
    }
    if (t === 2) {
      const { g } = until(r, () => ({ g: [0, 1, 2].map(() => ({ n: ri(r, 4, 25), m: ri(r, 30, 95) })) }), (v) => v.g.reduce((s, x) => s + x.n * x.m, 0) % v.g.reduce((s, x) => s + x.n, 0) === 0);
      const N = g.reduce((s, x) => s + x.n, 0), tot = g.reduce((s, x) => s + x.n * x.m, 0);
      return {
        prompt: `Three batches of a product were tested. Batch 1: ${g[0].n} units, average life ${g[0].m} hours. Batch 2: ${g[1].n} units, average ${g[1].m} hours. Batch 3: ${g[2].n} units, average ${g[2].m} hours. What is the average life of all units?`,
        correct: fmt(tot / N), wrongs: wrongOptions(fmt(tot / N), [fmt((g[0].m + g[1].m + g[2].m) / 3), fmt(tot / N + 3), fmt(tot / N - 3)], r),
        explanation: `Total hours = ${g.map((x) => `${x.n}×${x.m}`).join(' + ')} = ${tot}. Units = ${N}. Average = ${fmt(tot / N)} hours.`,
        verified: g.every((x) => Number.isInteger(x.n * x.m)) && Math.abs((tot / N) * N - tot) < 1e-9, seconds: secs(t) + 20,
      };
    }
    const { n1, m1, n2, n3, m3, avg } = until(r, () => ({ n1: ri(r, 6, 20), m1: ri(r, 40, 80), n2: ri(r, 6, 20), n3: ri(r, 6, 20), m3: ri(r, 40, 80), avg: ri(r, 45, 75) }), (v) => {
      const m2 = (v.avg * (v.n1 + v.n2 + v.n3) - v.n1 * v.m1 - v.n3 * v.m3) / v.n2;
      return Number.isInteger(m2) && m2 > 20 && m2 < 100 && m2 !== v.avg;
    });
    const m2 = (avg * (n1 + n2 + n3) - n1 * m1 - n3 * m3) / n2;
    return {
      prompt: `Three groups have ${n1}, ${n2} and ${n3} people. The first group averages ${m1} points and the third averages ${m3} points. The overall average of all ${n1 + n2 + n3} people is ${avg}. What is the average of the second group?`,
      correct: fmt(m2), wrongs: wrongOptions(fmt(m2), [fmt(avg), fmt((m1 + m3) / 2), fmt(2 * avg - m1)], r),
      explanation: `Overall total = ${avg} × ${n1 + n2 + n3} = ${avg * (n1 + n2 + n3)}. Known groups = ${n1}×${m1} + ${n3}×${m3} = ${n1 * m1 + n3 * m3}. Second group total = ${avg * (n1 + n2 + n3) - n1 * m1 - n3 * m3}, so its average = ${fmt(m2)}.`,
      verified: Math.abs((n1 * m1 + n2 * m2 + n3 * m3) / (n1 + n2 + n3) - avg) < 1e-9, seconds: secs(t) + 30,
    };
  },
};

// ---- Revenue and growth ----------------------------------------------------------------------
const revenue: Gen = {
  id: 'data-revenue', genre: 'data', skill: 'Revenue and growth', tiers: [1, 2, 3],
  make(r, t) {
    if (t === 1) {
      const price = ri(r, 3, 40) * 10, units = ri(r, 4, 60) * 10;
      return {
        prompt: `A store sold ${units} notebooks at ${money(price)} each. What was its revenue from notebooks?`,
        correct: money(price * units), wrongs: wrongOptions(money(price * units), [money(price + units), money(price * units * 10), money((price * units) / 10)], r),
        explanation: `Revenue = price × units = ${money(price)} × ${units} = ${money(price * units)}.`, verified: price * units === Array.from({ length: price }, () => units).reduce((a, b) => a + b, 0), seconds: secs(t),
      };
    }
    if (t === 2) {
      const { y1, y2, g } = until(r, () => ({ y1: ri(r, 20, 90) * 100, g: pick(r, [10, 20, 25, 30, 40, 50]), y2: 0 }), (v) => (v.y1 * v.g) % 100 === 0);
      const rev2 = y1 + (y1 * g) / 100;
      const units2 = ri(r, 4, 20) * 10;
      return {
        prompt: `Revenue last year was ${money(y1)}. This year it grew by ${g}% and ${units2} units were sold. What was the average revenue per unit this year?`,
        correct: money(rev2 / units2), wrongs: wrongOptions(money(rev2 / units2), [money(y1 / units2), money((y1 * g) / 100 / units2), money(rev2 / (units2 * 2))], r),
        explanation: `This year's revenue = ${money(y1)} × ${100 + g}/100 = ${money(rev2)}. Per unit = ${money(rev2)} ÷ ${units2} = ${money(rev2 / units2)}.`,
        verified: Math.abs((rev2 / units2) * units2 - y1 * (1 + g / 100)) < 1e-6, seconds: secs(t) + 10,
      };
    }
    const { P1, U1, pr, ud } = until(r, () => ({ P1: ri(r, 5, 30) * 10, U1: ri(r, 5, 40) * 20, pr: pick(r, [10, 20, 25, 50]), ud: pick(r, [10, 20, 25, 50]) }), (v) => {
      const P2 = (v.P1 * (100 + v.pr)) / 100, U2 = (v.U1 * (100 - v.ud)) / 100;
      return Number.isInteger(P2) && Number.isInteger(U2) && P2 * U2 !== v.P1 * v.U1 && v.pr !== v.ud;
    });
    const rev1 = P1 * U1;
    const rev2 = ((P1 * (100 + pr)) / 100) * ((U1 * (100 - ud)) / 100);
    const chg = ((rev2 - rev1) * 100) / rev1;
    return {
      prompt: `A shop's price per unit rises by ${pr}% but the units sold fall by ${ud}%. By what percentage does its revenue change?`,
      correct: `${fmt(Math.abs(chg))}% ${chg >= 0 ? 'increase' : 'decrease'}`,
      wrongs: wrongOptions(`${fmt(Math.abs(chg))}% ${chg >= 0 ? 'increase' : 'decrease'}`, [`${fmt(Math.abs(pr - ud))}% ${pr - ud >= 0 ? 'increase' : 'decrease'}`, `${fmt(Math.abs(chg) + 5)}% ${chg >= 0 ? 'increase' : 'decrease'}`, `${fmt(Math.abs(chg))}% ${chg >= 0 ? 'decrease' : 'increase'}`], r),
      explanation: `Revenue = price × units, so multiply the factors: ${(100 + pr) / 100} × ${(100 - ud) / 100} = ${fmt(((100 + pr) * (100 - ud)) / 10000)}. That is a ${fmt(Math.abs(chg))}% ${chg >= 0 ? 'increase' : 'decrease'}.`,
      verified: Math.abs(rev1 * (1 + chg / 100) - rev2) < 1e-6, seconds: secs(t) + 20,
    };
  },
};

export const DATA_GENS: Gen[] = [table, weighted, revenue];
