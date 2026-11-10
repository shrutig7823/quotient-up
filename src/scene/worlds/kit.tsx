import type { ReactNode } from 'react';
import { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { rng } from '../art';
import type { Pt, Sample } from '../path';
import type { TrailStyle } from '../trail';

export type WorldProps = { k: number; samples: Sample[]; route: Pt[] };

export type World = {
  slug: string;
  env: string; // "Tropical jungle"
  route: Pt[]; // 10 level stops, then the Mastery Trial landmark
  amp: number; // how much the trail winds
  trail: TrailStyle;
  bridges: [number, number][]; // route index pairs drawn as rope bridges
  node: { fill: string; rim: string; text: string; shape: 'circle' | 'square' | 'diamond' | 'octagon' };
  accent: string; // progress / highlights, also used on question screens
  scrim: string; // calm overlay colour behind questions
  Far: (p: WorldProps) => ReactNode;
  Mid: (p: WorldProps) => ReactNode;
  Fore: (p: WorldProps) => ReactNode;
};

// 20 level stops climbing the scene (easy at the bottom, hard near the top), then the Mastery Trial.
// `base` is a world's flavour of sway (10 values); stops alternate left/right so they never crowd.
export const makeRoute = (base: number[]): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i < 20; i++) {
    const b = base[Math.min(base.length - 1, Math.floor(i / 2))];
    const centre = 200 + (b - 200) * 0.5;
    const reach = 58 + 26 * Math.abs(Math.sin(i * 0.9 + base[0] * 0.01));
    pts.push([centre + (i % 2 ? reach : -reach), 1400 - i * 60]);
  }
  pts.push([200, 170]);
  return pts;
};

export function Sky({ id, stops }: { id: string; stops: [number, string][] }) {
  return (
    <>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {stops.map(([o, c]) => (
            <Stop key={o} offset={o} stopColor={c} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width={400} height={1500} fill={`url(#${id})`} />
    </>
  );
}

// Random points kept clear of the trail and of the trial landmark.
export function scatter(seed: number, n: number, samples: Sample[], minD: number, xr: [number, number], yr: [number, number], tries = 600) {
  const r = rng(seed);
  const out: Pt[] = [];
  for (let i = 0; i < tries && out.length < n; i++) {
    const x = xr[0] + r() * (xr[1] - xr[0]);
    const y = yr[0] + r() * (yr[1] - yr[0]);
    if (samples.some((p) => Math.hypot(p.x - x, p.y - y) < minD)) continue;
    if (Math.hypot(x - 200, y - 250) < 110) continue;
    out.push([x, y]);
  }
  return out.sort((a, b) => a[1] - b[1]);
}
