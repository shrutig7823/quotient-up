// Every question is data: a `type` plus a payload. The screen picks a renderer from `type`.
// Answers are strings (a typed entry, a choice id) or numbers (legacy interactive types).
export type Concept = string; // "quant:percentages"
export type Answer = string | number;

type Base = {
  id: string;
  concept: Concept;
  skill?: string; // readable skill name, e.g. "Percentage changes"
  difficulty: 1 | 2 | 3; // easy / medium / hard (editorial, not calibrated)
  expectedSeconds: number;
  explanation: string;
};

// Select one of the listed options. Validation is by stable choice id, never by position.
export type ChoiceQuestion = Base & {
  type: 'choice';
  prompt: string;
  choices: { id: string; label: string }[];
  answerId: string;
};

// Typed answer: a number/fraction, a word or code, an ordered list, or a coordinate pair.
export type EntryQuestion = Base & {
  type: 'entry';
  prompt: string;
  format: 'numeric' | 'text' | 'order' | 'coordinate';
  answer: string; // the canonical answer (only used to check, never rendered before submission)
};

// Legacy interactive types (kept for the interactive-renderer work; the imported bank does not use them yet).
export type McqQuestion = Base & { type: 'mcq'; prompt: string; options: string[]; answerIndex: number };
export type SequenceQuestion = Base & { type: 'sequence'; prompt: string; sequence: (number | null)[]; choices: number[]; answer: number };
export type BalanceQuestion = Base & {
  type: 'balance'; prompt: string; leftLabel: string; rightLabel: string; leftValue: number; ratio: [number, number]; max: number;
};

export type Question = ChoiceQuestion | EntryQuestion | McqQuestion | SequenceQuestion | BalanceQuestion;

export type Level = {
  id: string; // "quant-1"
  genre: string;
  n: number;
  title: string;
  stage: 'easy' | 'medium' | 'hard';
  questions: Question[];
};
