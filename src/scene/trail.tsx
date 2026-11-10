import { useMemo } from 'react';
import { G, Line, Path, Rect } from 'react-native-svg';

import { type Pt, type Sample, polyD, sample, smooth, toD, winding } from './path';

export type TrailStyle = {
  under: string; // shadow beneath the trail
  w: number; // trail width
  stone: string; // step side colour
  top: string; // step top colour
  dash: string; // step pattern
  glow: string; // magical accent colour
  glowDash: string;
  plank?: string; // rope-bridge planks
  rope?: string;
};

export type BuiltTrail = { d: string; samples: Sample[] };

export function buildTrail(points: Pt[], amp = 26, perSeg = 10): BuiltTrail {
  const segs = smooth(winding(points, amp));
  return { d: toD(segs), samples: sample(segs, perSeg) };
}

// Index of the sample closest to a point (to attach bridges / glow to stops).
export const nearestSample = (samples: Sample[], x: number, y: number) => {
  let best = 0;
  let bd = Infinity;
  samples.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
};

// Winding stone-step trail, with optional rope-bridge spans and a stretch lit with magic.
export function Trail({ built, style, litTo = 0, bridges = [] }: { built: BuiltTrail; style: TrailStyle; litTo?: number; bridges?: [number, number][] }) {
  const lit = useMemo(() => (litTo > 1 ? polyD(built.samples, 0, litTo) : ''), [built, litTo]);
  return (
    <G>
      <Path d={built.d} stroke={style.under} strokeWidth={style.w + 8} strokeOpacity={0.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={built.d} stroke={style.stone} strokeWidth={style.w} strokeDasharray={style.dash} fill="none" strokeLinejoin="round" />
      <Path d={built.d} stroke={style.top} strokeWidth={style.w - 4} strokeDasharray={style.dash} strokeDashoffset={1.5} fill="none" strokeLinejoin="round" opacity={0.9} />
      <Path d={built.d} stroke={style.glow} strokeWidth={1.6} strokeDasharray={style.glowDash} strokeLinecap="round" fill="none" opacity={0.35} />
      {lit !== '' && <Path d={lit} stroke={style.glow} strokeWidth={2.6} strokeDasharray={style.glowDash} strokeLinecap="round" fill="none" opacity={0.95} />}
      {bridges.map(([a, b], i) => {
        const pts = built.samples.slice(a, b + 1);
        if (pts.length < 2) return null;
        const first = pts[0];
        const last = pts[pts.length - 1];
        return (
          <G key={i}>
            <Path d={polyD(built.samples, a, b)} stroke={style.under} strokeWidth={style.w + 6} strokeOpacity={0.55} fill="none" />
            <Path d={polyD(built.samples, a, b)} stroke={style.plank ?? '#7A5532'} strokeWidth={style.w} strokeDasharray="3.2 2" fill="none" />
            <Path d={polyD(built.samples, a, b).replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (_, x, y) => `${x} ${(parseFloat(y) - 10).toFixed(1)}`)} stroke={style.rope ?? '#DCC48C'} strokeWidth={1.6} fill="none" />
            {[first, last].map((p, j) => (
              <G key={j}>
                <Line x1={p.x} y1={p.y + 2} x2={p.x} y2={p.y - 12} stroke="#4A3426" strokeWidth={3} strokeLinecap="round" />
                <Rect x={p.x - 2.5} y={p.y - 14} width={5} height={3} fill="#4A3426" />
              </G>
            ))}
          </G>
        );
      })}
    </G>
  );
}

export const STONE_TRAIL: TrailStyle = {
  under: '#10261F', w: 15, stone: '#7C7360', top: '#B8AE93', dash: '9 4', glow: '#5FF2E0', glowDash: '2 12',
};
