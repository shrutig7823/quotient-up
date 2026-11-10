// Trail geometry. Pure functions, so the trail, the hit targets and the scenery all
// derive from the same list of points and stay aligned at any screen size.
export type Pt = [number, number];
export type Seg = { p0: Pt; c1: Pt; c2: Pt; p1: Pt };
export type Sample = { x: number; y: number; seg: number; t: number };

// Insert a sideways-offset waypoint between each pair of points so the trail winds
// instead of running straight between stops.
export function winding(points: Pt[], amp = 30): Pt[] {
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const side = i % 2 === 0 ? 1 : -1;
    out.push([(x0 + x1) / 2 + side * amp, (y0 + y1) / 2]);
    out.push(points[i]);
  }
  return out;
}

// Catmull-Rom spline through the points, expressed as cubic Beziers.
export function smooth(points: Pt[]): Seg[] {
  const segs: Seg[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const a = points[i - 1] ?? p0;
    const b = points[i + 2] ?? p1;
    segs.push({
      p0,
      p1,
      c1: [p0[0] + (p1[0] - a[0]) / 6, p0[1] + (p1[1] - a[1]) / 6],
      c2: [p1[0] - (b[0] - p0[0]) / 6, p1[1] - (b[1] - p0[1]) / 6],
    });
  }
  return segs;
}

export const toD = (segs: Seg[]) =>
  segs.map((s, i) => `${i === 0 ? `M ${s.p0[0]} ${s.p0[1]} ` : ''}C ${s.c1[0]} ${s.c1[1]}, ${s.c2[0]} ${s.c2[1]}, ${s.p1[0]} ${s.p1[1]}`).join(' ');

const cubic = (s: Seg, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * s.p0[0] + 3 * u * u * t * s.c1[0] + 3 * u * t * t * s.c2[0] + t * t * t * s.p1[0],
    u * u * u * s.p0[1] + 3 * u * u * t * s.c1[1] + 3 * u * t * t * s.c2[1] + t * t * t * s.p1[1],
  ];
};

export function sample(segs: Seg[], perSeg = 10): Sample[] {
  const out: Sample[] = [];
  segs.forEach((s, seg) => {
    for (let i = 0; i <= perSeg; i++) {
      const t = i / perSeg;
      const [x, y] = cubic(s, t);
      out.push({ x, y, seg, t });
    }
  });
  return out;
}

export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export const pathD = (points: Pt[]) => toD(smooth(points));

// Sub-path d-string made of the samples whose index lies in [from, to].
export const polyD = (samples: Sample[], from: number, to: number) =>
  samples.slice(from, to + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
