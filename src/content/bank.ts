import type { Level, Question } from '../questions/types';
import { generateForLevel } from './gen';
import bankJson from './bank.json';

// The authored question bank (imported by scripts/import-bank.mjs). All records are "draft",
// original, with editorial (uncalibrated) difficulty. Two fresh questions per level for now.
type Rec = {
  id: string; genreId: string; primarySkill: string; difficulty: 'easy' | 'medium' | 'hard'; answerFormat: string;
  expectedSeconds: number; level: number | null; prompt: string; answer: string; explanation: string;
  choices?: { id: string; label: string }[];
};

const DIFF = { easy: 1, medium: 2, hard: 3 } as const;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = (s: string) => s.toLowerCase().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim();

export function toQuestion(r: Rec): Question {
  const base = {
    id: r.id,
    concept: `${r.genreId}:${slug(r.primarySkill)}`,
    skill: r.primarySkill,
    difficulty: DIFF[r.difficulty],
    expectedSeconds: r.expectedSeconds,
    explanation: r.explanation,
    prompt: r.prompt,
  };
  if (r.answerFormat === 'select' && r.choices) {
    const answerId = r.choices.find((c) => norm(c.label) === norm(r.answer))?.id;
    if (answerId) return { ...base, type: 'choice', choices: r.choices, answerId };
  }
  const format = (['numeric', 'text', 'order', 'coordinate'] as const).find((f) => f === r.answerFormat) ?? 'text';
  return { ...base, type: 'entry', format, answer: r.answer };
}

const stageOf = (n: number): Level['stage'] => (n <= 6 ? 'easy' : n <= 16 ? 'medium' : 'hard');

const tierOf = (n: number): 1 | 2 | 3 => (n <= 6 ? 1 : n <= 16 ? 2 : 3);

// Each level = the 2 authored questions + 3 generated ones (exam-style A-D, answers cross-checked in code).
function buildLevels(genre: string): Level[] {
  const recs = (bankJson.questions as Rec[]).filter((r) => r.genreId === genre);
  return Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    const qs = recs.filter((r) => r.level === n);
    const skills = [...new Set(qs.map((r) => r.primarySkill))];
    const authored = qs.map(toQuestion);
    const generated = generateForLevel(genre, n, tierOf(n), authored.map((q) => ('prompt' in q ? q.prompt : '')));
    return { id: `${genre}-${n}`, genre, n, title: skills.join(' & '), stage: stageOf(n), questions: [...authored, ...generated] };
  });
}

export const GENRE_IDS = ['quant', 'logic', 'data', 'verbal', 'spatial', 'applied'] as const;
export const LEVELS: Record<string, Level[]> = Object.fromEntries(GENRE_IDS.map((g) => [g, buildLevels(g)]));
export const SUMMIT_QUESTIONS: Question[] = (bankJson.summit as unknown as Rec[]).map(toQuestion);
export const ALL_RECORDS = bankJson.questions as unknown as Rec[];
