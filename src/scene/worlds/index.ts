import { applied } from './applied';
import { data } from './data';
import type { World } from './kit';
import { logic } from './logic';
import { quant } from './quant';
import { spatial } from './spatial';
import { verbal } from './verbal';

// One distinct environment per category.
export const WORLDS: Record<string, World> = { quant, logic, data, verbal, spatial, applied };

export const getWorld = (slug: string): World | undefined => WORLDS[slug];
export type { World } from './kit';
