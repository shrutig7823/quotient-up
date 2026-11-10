// Imports the authored question bank (Markdown) into src/content/bank.json.
//   node scripts/import-bank.mjs "<path to Aptitude_Game_20_Levels_Question_Bank_Claude_Brief.md>"
// Stable IDs (QUA-001 ...) are kept as given. Review status is NOT upgraded by importing.
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2];
if (!src) throw new Error('Pass the path to the question-bank .md file');
const lines = readFileSync(src, 'utf8').split(/\r?\n/);

const GENRE = { QUA: 'quant', LOG: 'logic', DAT: 'data', VER: 'verbal', SPA: 'spatial', APP: 'applied' };
const GENRE_BY_NAME = { Quant: 'quant', Logic: 'logic', Data: 'data', Verbal: 'verbal', Spatial: 'spatial', Applied: 'applied' };

const norm = (s) => s.toLowerCase().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim();

// Pull the answer options out of a select-type prompt. The bank writes them in prose, so we try a
// few known shapes and only accept a result that contains the correct answer.
function extractChoices(prompt, answer) {
  const a = norm(answer);
  const ok = (arr) => arr.length >= 2 && arr.some((c) => norm(c) === a);
  const clean = (arr) => arr.map((s) => s.replace(/^(and|or)\s+/i, '').replace(/[?.]+$/g, '').trim()).filter(Boolean);

  if (/answer yes or no/i.test(prompt) || a === 'yes' || a === 'no') return ['Yes', 'No'];

  const opt = prompt.match(/Options:\s*(.+)$/i);
  if (opt) {
    const c = clean(opt[1].split(';'));
    if (ok(c)) return c;
  }

  const lettered = [...prompt.matchAll(/\b([A-E])\s*=/g)].map((m) => m[1]);
  if (lettered.length >= 2 && /^[A-E]$/.test(answer.trim())) return [...new Set(lettered)];

  const afterColon = prompt.slice(prompt.lastIndexOf(':') + 1);
  if (prompt.includes(':')) {
    const c = clean(afterColon.split(/,|;/).flatMap((p) => (p.includes(' or ') && !p.includes(',') ? p.split(' or ') : [p])));
    if (ok(c)) return c;
  }

  const orPair = prompt.match(/\b(?:is|are)\s+(?:the\s+)?(.+?)\s+or\s+(.+?)\?/i);
  if (orPair && ok(clean([orPair[1], orPair[2]]))) return clean([orPair[1], orPair[2]]);

  const letters = [...prompt.matchAll(/\b(?:Pack|Plan|Option|Route|Team|Switch|Offer|Path)\s+([A-E])\b/g)].map((m) => m[1]);
  if (/^[A-E]$/.test(answer.trim()) && new Set(letters).size >= 2) return [...new Set(letters)];

  const bare = [...new Set([...prompt.matchAll(/\b([A-E])\b(?=\s*[:)])/g)].map((m) => m[1]))];
  if (/^[A-E]$/.test(answer.trim()) && bare.length >= 2 && bare.includes(answer.trim())) return bare;

  return null;
}

function parseBlock(header, body) {
  const field = (name) => (body.find((l) => l.startsWith(`- **${name}:**`)) ?? '').replace(`- **${name}:**`, '').trim();
  const text = (name) => {
    const i = body.findIndex((l) => l.startsWith(`**${name}:**`));
    if (i < 0) return '';
    const first = body[i].replace(`**${name}:**`, '').trim();
    const rest = [];
    for (let j = i + 1; j < body.length && !body[j].startsWith('**') && !body[j].startsWith('- **'); j++) if (body[j].trim()) rest.push(body[j].trim());
    return [first, ...rest].join(' ').trim();
  };
  return {
    difficulty: field('Difficulty'),
    answerFormat: field('Format'),
    expectedSeconds: parseInt(field('Estimated time'), 10) || 60,
    level: parseInt(field('Level'), 10) || null,
    prompt: text('Question'),
    answer: text('Answer'),
    explanation: text('Worked explanation'),
  };
}

const records = [];
const summit = [];
for (let i = 0; i < lines.length; i++) {
  const core = lines[i].match(/^#### ([A-Z]{3})-(\d{3}) — (.+)$/);
  const sum = lines[i].match(/^### (SUM-\d{3}) — (.+?) \/ (.+)$/);
  if (!core && !sum) continue;
  let j = i + 1;
  while (j < lines.length && !/^#{2,4} /.test(lines[j])) j++;
  const b = parseBlock(lines[i], lines.slice(i + 1, j));
  if (core) {
    const id = `${core[1]}-${core[2]}`;
    records.push({ id, genreId: GENRE[core[1]], primarySkill: core[3].trim(), ...b });
  } else {
    summit.push({ id: sum[1], genreId: GENRE_BY_NAME[sum[2]], primarySkill: sum[3].trim(), ...b, level: null });
  }
}

// Options the prose rules cannot extract; read by hand from the prompts.
const OVERRIDES = { 'APP-019': ['A', 'B'], 'APP-025': ['50%', '5%'], 'APP-037': ['A', 'B'] };

let fallback = [];
for (const r of [...records, ...summit]) {
  r.contentVersion = 1;
  r.reviewStatus = 'draft';
  r.provenance = 'original_authored';
  if (r.answerFormat === 'select') {
    const ch = OVERRIDES[r.id] ?? extractChoices(r.prompt, r.answer);
    if (ch) r.choices = ch.map((label, n) => ({ id: `${r.id}-c${n + 1}`, label }));
    else fallback.push(r.id);
  }
}

writeFileSync(new URL('../src/content/bank.json', import.meta.url), JSON.stringify({ contentVersion: 1, questions: records, summit }, null, 1));
const byGenre = Object.fromEntries(Object.values(GENRE).map((g) => [g, records.filter((r) => r.genreId === g).length]));
console.log(JSON.stringify({ genreQuestions: records.length, summitQuestions: summit.length, byGenre, selectWithoutChoices: fallback }));
