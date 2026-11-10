import type { Level } from '../questions/types';
import { LEVELS } from './bank';

// Every genre now has 20 authored levels (2 questions each).
export const getLevel = (id: string): Level | undefined => Object.values(LEVELS).flat().find((l) => l.id === id);

export const levelsFor = (genre: string): Level[] => LEVELS[genre] ?? [];
