import { type Gen, type Tier, pick, ri, secs, until } from './kit';
import { shuffle } from '../rng';

type Pair = [string, string];
const REL: Record<string, { tier: Tier; note: string; pairs: Pair[] }> = {
  opposite: { tier: 1, note: 'are opposites', pairs: [['hot', 'cold'], ['ascend', 'descend'], ['expand', 'contract'], ['ancient', 'modern'], ['scarce', 'abundant'], ['generous', 'stingy'], ['victory', 'defeat'], ['arrive', 'depart'], ['rigid', 'flexible'], ['transparent', 'opaque'], ['accept', 'reject']] },
  tool: { tier: 1, note: 'name a tool and what it does', pairs: [['knife', 'cut'], ['pen', 'write'], ['needle', 'sew'], ['telescope', 'observe'], ['broom', 'sweep'], ['thermometer', 'measure'], ['hammer', 'strike'], ['key', 'unlock']] },
  part: { tier: 2, note: 'name a part and its whole', pairs: [['petal', 'flower'], ['page', 'book'], ['wheel', 'car'], ['branch', 'tree'], ['chapter', 'novel'], ['finger', 'hand'], ['brick', 'wall'], ['note', 'melody']] },
  worker: { tier: 2, note: 'name a worker and the tool of the trade', pairs: [['carpenter', 'saw'], ['painter', 'brush'], ['surgeon', 'scalpel'], ['farmer', 'plough'], ['astronomer', 'telescope'], ['cobbler', 'awl']] },
  cause: { tier: 3, note: 'name a cause and its usual effect', pairs: [['fire', 'smoke'], ['drought', 'famine'], ['practice', 'mastery'], ['infection', 'fever'], ['friction', 'heat'], ['flood', 'damage']] },
  degree: { tier: 3, note: 'show a mild word and its stronger form', pairs: [['warm', 'hot'], ['cool', 'cold'], ['like', 'love'], ['dislike', 'hate'], ['drizzle', 'downpour'], ['breeze', 'gale'], ['tired', 'exhausted']] },
};
const inRel = (rel: { pairs: Pair[] }, a: string, b: string) => rel.pairs.some(([x, y]) => x === a && y === b);

const analogy: Gen = {
  id: 'verbal-analogy', genre: 'verbal', skill: 'Word analogies', tiers: [1, 2, 3],
  make(r, t) {
    const key = pick(r, Object.keys(REL).filter((k) => REL[k].tier === t));
    const rel = REL[key];
    const [p1, p2] = (() => { const a = pick(r, rel.pairs); return [a, until(r, () => pick(r, rel.pairs), (b) => b !== a)] as const; })();
    const [a, b] = p1, [c, d] = p2;
    // Wrong options come from the SAME relationship (right kind of word, wrong partner) so they are believable.
    const sameKind = shuffle(r, rel.pairs.map(([, y]) => y));
    const anyWord = shuffle(r, Object.values(REL).flatMap((x) => x.pairs.map(([, y]) => y)));
    const wrongs = [...new Set([...sameKind, b, ...anyWord].filter((w) => w !== d && w !== c && !inRel(rel, c, w) && !inRel(rel, w, c)))].slice(0, 3);
    return {
      prompt: `${a} : ${b} :: ${c} : ?`,
      correct: d, wrongs,
      explanation: `${a} and ${b} ${rel.note}. In the same way, ${c} goes with ${d}.`,
      verified: inRel(rel, c, d) && wrongs.every((w) => !inRel(rel, c, w)) && wrongs.length === 3, seconds: secs(t) - 10,
    };
  },
};

const CATS: { tier: Tier; a: { name: string; items: string[] }; b: { name: string; items: string[] } }[] = [
  { tier: 1, a: { name: 'fruits', items: ['apple', 'mango', 'grape', 'banana', 'papaya', 'guava'] }, b: { name: 'vehicles', items: ['bus', 'tram', 'truck', 'scooter', 'train', 'tractor'] } },
  { tier: 1, a: { name: 'metals', items: ['iron', 'copper', 'zinc', 'silver', 'tin', 'nickel'] }, b: { name: 'colours', items: ['red', 'violet', 'indigo', 'orange', 'maroon', 'teal'] } },
  { tier: 2, a: { name: 'mammals', items: ['whale', 'bat', 'dolphin', 'tiger', 'otter', 'seal'] }, b: { name: 'reptiles', items: ['lizard', 'crocodile', 'turtle', 'python', 'gecko', 'cobra'] } },
  { tier: 2, a: { name: 'wind instruments', items: ['flute', 'clarinet', 'oboe', 'trumpet', 'bugle', 'piccolo'] }, b: { name: 'string instruments', items: ['violin', 'cello', 'sitar', 'guitar', 'harp', 'banjo'] } },
  { tier: 3, a: { name: 'prime numbers', items: ['2', '3', '5', '7', '11', '13', '17', '19', '23', '29'] }, b: { name: 'composite numbers', items: ['4', '6', '9', '15', '21', '25', '27', '33', '35'] } },
  { tier: 3, a: { name: 'perfect squares', items: ['4', '9', '16', '25', '36', '49', '64', '81'] }, b: { name: 'non-squares', items: ['8', '12', '18', '27', '40', '50', '72'] } },
];

const odd: Gen = {
  id: 'verbal-odd', genre: 'verbal', skill: 'Odd one out', tiers: [1, 2, 3],
  make(r, t) {
    const c = pick(r, CATS.filter((x) => x.tier === t));
    const [main, other] = r() < 0.5 ? [c.a, c.b] : [c.b, c.a];
    const three = shuffle(r, main.items).slice(0, 3);
    const intruder = pick(r, other.items);
    return {
      prompt: `Three of these four belong together. Which one does not belong?\n${shuffle(r, [...three, intruder]).join(', ')}`,
      correct: intruder, wrongs: three,
      explanation: `${three.join(', ')} are all ${main.name}. ${intruder} is ${other.name}.`,
      verified: three.every((x) => main.items.includes(x)) && !main.items.includes(intruder) && other.items.includes(intruder), seconds: secs(t) - 10,
    };
  },
};

const SYN: { tier: Tier; pairs: Pair[] }[] = [
  { tier: 1, pairs: [['brief', 'short'], ['huge', 'enormous'], ['begin', 'start'], ['rapid', 'swift'], ['difficult', 'hard'], ['happy', 'cheerful'], ['silent', 'quiet'], ['gift', 'present'], ['brave', 'courageous'], ['skilled', 'expert']] },
  { tier: 2, pairs: [['diligent', 'industrious'], ['frugal', 'thrifty'], ['candid', 'frank'], ['meticulous', 'careful'], ['reluctant', 'unwilling'], ['obsolete', 'outdated'], ['tenacious', 'persistent'], ['ephemeral', 'short-lived'], ['lucid', 'clear'], ['scarce', 'rare']] },
  { tier: 3, pairs: [['ubiquitous', 'omnipresent'], ['ambiguous', 'equivocal'], ['benevolent', 'charitable'], ['ostentatious', 'showy'], ['pragmatic', 'practical'], ['eloquent', 'articulate'], ['vindicate', 'exonerate'], ['mitigate', 'alleviate'], ['tacit', 'unspoken'], ['austere', 'severe']] },
];
const vocab: Gen = {
  id: 'verbal-vocab', genre: 'verbal', skill: 'Vocabulary', tiers: [1, 2, 3],
  make(r, t) {
    const bank = SYN.find((x) => x.tier === t)!.pairs;
    const [w, s] = pick(r, bank);
    const wrongs = shuffle(r, bank.filter(([x]) => x !== w).map(([, y]) => y)).slice(0, 3);
    return {
      prompt: `Choose the word closest in meaning to "${w}".`,
      correct: s, wrongs, explanation: `"${w}" means about the same as "${s}".`,
      verified: wrongs.length === 3 && !wrongs.includes(s), seconds: secs(t) - 20,
    };
  },
};

// ---- Statements and conclusions (checked by exhaustive set models) ---------------------------
const SETS = [['poets', 'painters', 'teachers'], ['rivers', 'lakes', 'oceans'], ['doctors', 'artists', 'runners'], ['roses', 'flowers', 'plants'], ['pilots', 'sailors', 'engineers'], ['books', 'novels', 'poems']];
type Form = 'all' | 'no' | 'some';
type Stmt = { f: Form; x: number; y: number };
const text = (s: Stmt, n: string[]) => (s.f === 'all' ? `All ${n[s.x]} are ${n[s.y]}.` : s.f === 'no' ? `No ${n[s.x]} are ${n[s.y]}.` : `Some ${n[s.x]} are ${n[s.y]}.`);
// A region is a bitmask over (A, B, C). A "world" is which regions are populated.
const holds = (s: Stmt, populated: number[]) =>
  s.f === 'all' ? populated.every((m) => !((m >> s.x) & 1) || (m >> s.y) & 1)
  : s.f === 'no' ? populated.every((m) => !(((m >> s.x) & 1) && ((m >> s.y) & 1)))
  : populated.some((m) => ((m >> s.x) & 1) && ((m >> s.y) & 1));
function follows(premises: Stmt[], c: Stmt): boolean {
  for (let mask = 0; mask < 256; mask++) {
    const pop = [...Array(8).keys()].filter((m) => (mask >> m) & 1);
    if (premises.every((p) => holds(p, pop)) && !holds(c, pop)) return false;
  }
  return true;
}
// Second method: models made of 3 individuals, each placed in a region.
function followsByIndividuals(premises: Stmt[], c: Stmt): boolean {
  for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) for (let d = 0; d < 8; d++) {
    const pop = [a, b, d];
    if (premises.every((p) => holds(p, pop)) && !holds(c, pop)) return false;
  }
  return true;
}
const syllogism: Gen = {
  id: 'verbal-syllogism', genre: 'verbal', skill: 'Statements and conclusions', tiers: [2, 3],
  make(r, t) {
    const names = pick(r, SETS);
    const want = ri(r, 0, 3); // 0 only I, 1 only II, 2 both, 3 neither
    const draw = () => {
      const f = (): Form => pick(r, ['all', 'no', 'some'] as Form[]);
      const premises: Stmt[] = [{ f: f(), x: 0, y: 1 }, { f: t === 3 ? f() : pick(r, ['all', 'some'] as Form[]), x: 1, y: 2 }];
      const c1: Stmt = { f: f(), x: 0, y: 2 };
      const c2: Stmt = { f: f(), x: 2, y: 0 };
      return { premises, c1, c2 };
    };
    const q = until(r, draw, (v) => {
      const a = follows(v.premises, v.c1), b = follows(v.premises, v.c2);
      return (a ? (b ? 2 : 0) : b ? 1 : 3) === want;
    }, 2000);
    const opts = ['Only conclusion I follows', 'Only conclusion II follows', 'Both conclusions follow', 'Neither conclusion follows'];
    const a = follows(q.premises, q.c1), b = follows(q.premises, q.c2);
    return {
      prompt: `Statements:\n${text(q.premises[0], names)}\n${text(q.premises[1], names)}\n\nConclusions:\nI. ${text(q.c1, names)}\nII. ${text(q.c2, names)}\n\nTake the statements as true. Which option is correct?`,
      correct: opts[want], wrongs: opts.filter((_, i) => i !== want),
      explanation: `Draw every way the groups could overlap that keeps both statements true. Conclusion I ${a ? 'holds in all of them' : 'fails in at least one'}; conclusion II ${b ? 'holds in all of them' : 'fails in at least one'}. A conclusion follows only if it holds in every possible case, and "All" or "No" statements never prove that members exist.`,
      verified: followsByIndividuals(q.premises, q.c1) === a && followsByIndividuals(q.premises, q.c2) === b, seconds: secs(t) + 40,
    };
  },
};

export const VERBAL_GENS: Gen[] = [analogy, odd, vocab, syllogism];
