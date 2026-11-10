// Genre configuration layer: rename or reorder genres here without touching screens.
export type Genre = {
  slug: string;
  name: string;
  short: string;
  emoji: string;
  world: string;
  color: string;
  dark: string;
  levelCount: number;
};

export const GENRES: Genre[] = [
  // Each genre has its own world and 20 scored levels (easy 1-6, medium 7-16, hard 17-20).
  { slug: 'quant', name: 'Quantitative Aptitude', short: 'Quant', emoji: '🔥', world: 'Tropical jungle', color: '#F59E0B', dark: '#B45309', levelCount: 20 },
  { slug: 'logic', name: 'Logical Reasoning', short: 'Logic', emoji: '🌴', world: 'Amazon rainforest', color: '#10B981', dark: '#047857', levelCount: 20 },
  { slug: 'data', name: 'Data Interpretation', short: 'Data', emoji: '🧊', world: 'Crystal highlands', color: '#38BDF8', dark: '#0369A1', levelCount: 20 },
  { slug: 'verbal', name: 'Verbal Reasoning', short: 'Verbal', emoji: '🏜️', world: 'Desert oasis', color: '#F97316', dark: '#C2410C', levelCount: 20 },
  { slug: 'spatial', name: 'Spatial & Pattern', short: 'Spatial', emoji: '🌊', world: 'Floating islands', color: '#A78BFA', dark: '#6D28D9', levelCount: 20 },
  { slug: 'applied', name: 'Applied Reasoning', short: 'Applied', emoji: '🌃', world: 'Volcanic wilderness', color: '#F43F5E', dark: '#BE123C', levelCount: 20 },
];

// Genres with authored, playable content. All six have 20 levels from the question bank.
// (Diagram and drag interactions for the visual topics are still to be built; see the summary.)
export const PLAYABLE_GENRES = new Set(['quant', 'logic', 'data', 'verbal', 'spatial', 'applied']);

export const GOALS = [
  'Placements',
  'CAT',
  'Banking',
  'Government exams',
  'General aptitude',
  'Just want to get sharper',
] as const;

export const AGE_GROUPS = ['Under 18', '18-22', '23-30', '31+'] as const;

export const DAILY_MINUTES = [5, 10, 20] as const;

export const getGenre = (slug: string) => GENRES.find((g) => g.slug === slug);
