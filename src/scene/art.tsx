import { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

// Illustration primitives. Everything is drawn in "scene units" (the viewBox), so scenes scale cleanly.
export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const T = (x: number, y: number, s: number) => `translate(${x} ${y}) scale(${s})`;

// Soft light: stacked translucent discs.
export function Glow({ cx, cy, r, color, o = 1 }: { cx: number; cy: number; r: number; color: string; o?: number }) {
  return (
    <G opacity={o}>
      <Circle cx={cx} cy={cy} r={r} fill={color} opacity={0.08} />
      <Circle cx={cx} cy={cy} r={r * 0.74} fill={color} opacity={0.12} />
      <Circle cx={cx} cy={cy} r={r * 0.5} fill={color} opacity={0.18} />
      <Circle cx={cx} cy={cy} r={r * 0.28} fill={color} opacity={0.3} />
    </G>
  );
}

// Jagged distant mountains; `snow` adds caps to the tall peaks.
export function Ridge({ y, h, seed, fill, peaks = 8, opacity = 1, snow, w = 400 }: { y: number; h: number; seed: number; fill: string; peaks?: number; opacity?: number; snow?: string; w?: number }) {
  const r = rng(seed);
  const n = peaks * 2;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const up = i % 2 === 0 ? 0.4 + 0.6 * r() : 0.04 + 0.16 * r();
    pts.push([-10 + ((w + 20) * i) / n, y - h * up, up]);
  }
  const d = `M -10 ${y + h} ` + pts.map(([x, yy]) => `L ${x.toFixed(1)} ${yy.toFixed(1)}`).join(' ') + ` L ${w + 10} ${y + h} Z`;
  return (
    <G opacity={opacity}>
      <Path d={d} fill={fill} />
      {snow && pts.filter(([, , up]) => up > 0.72).map(([x, yy], i) => (
        <Polygon key={i} points={`${x},${yy} ${x - 13},${yy + 16} ${x - 5},${yy + 11} ${x + 2},${yy + 18} ${x + 13},${yy + 14}`} fill={snow} opacity={0.9} />
      ))}
    </G>
  );
}

// Rolling hills / dunes made from a sine-ish line.
export function Hills({ y, amp, seed, fill, w = 400, bottom = 1500, step = 16, wave = 0.045 }: { y: number; amp: number; seed: number; fill: string; w?: number; bottom?: number; step?: number; wave?: number }) {
  const ph = rng(seed)() * 6.28;
  let d = `M -10 ${bottom} `;
  for (let x = -10; x <= w + 10; x += step) d += `L ${x} ${(y + amp * Math.sin(x * wave + ph) + amp * 0.5 * Math.sin(x * wave * 2.3 + ph * 1.7)).toFixed(1)} `;
  return <Path d={d + `L ${w + 10} ${bottom} Z`} fill={fill} />;
}

export function Cloud({ x, y, s = 1, fill = '#FFFFFF', opacity = 0.9 }: { x: number; y: number; s?: number; fill?: string; opacity?: number }) {
  return (
    <G transform={T(x, y, s)} opacity={opacity}>
      <Ellipse cx={0} cy={0} rx={40} ry={11} fill={fill} />
      <Ellipse cx={-18} cy={-8} rx={20} ry={12} fill={fill} />
      <Ellipse cx={10} cy={-13} rx={24} ry={15} fill={fill} />
      <Ellipse cx={30} cy={-3} rx={18} ry={9} fill={fill} />
    </G>
  );
}

export function Stars({ seed, n = 40, w = 400, h = 600, color = '#FFFFFF' }: { seed: number; n?: number; w?: number; h?: number; color?: string }) {
  const r = rng(seed);
  return (
    <G>
      {Array.from({ length: n }, (_, i) => (
        <Circle key={i} cx={r() * w} cy={r() * h} r={0.5 + r() * 1.1} fill={color} opacity={0.3 + r() * 0.5} />
      ))}
    </G>
  );
}

type TreeC = { dark?: string; mid?: string; light?: string; trunk?: string };

export function Tree({ x, y, s = 1, dark = '#0B3B2E', mid = '#14684C', light = '#2AA06A', trunk = '#3B2A1C' }: { x: number; y: number; s?: number } & TreeC) {
  return (
    <G transform={T(x, y, s)}>
      <Path d="M-3 0 L-2 -26 L2 -26 L3 0 Z" fill={trunk} />
      <Circle cx={0} cy={-38} r={17} fill={dark} />
      <Circle cx={-12} cy={-30} r={12} fill={dark} />
      <Circle cx={12} cy={-30} r={12} fill={dark} />
      <Circle cx={-3} cy={-42} r={12} fill={mid} />
      <Circle cx={8} cy={-34} r={9} fill={mid} />
      <Circle cx={-7} cy={-46} r={6} fill={light} />
      <Circle cx={4} cy={-40} r={4} fill={light} />
    </G>
  );
}

// Tall trunk with a high canopy and buttress roots: for rainforest "giants".
export function Giant({ x, y, s = 1, trunk = '#2A1F17', trunk2 = '#3A2B20', leaf = '#0A3A2B', leaf2 = '#11553F' }: { x: number; y: number; s?: number; trunk?: string; trunk2?: string; leaf?: string; leaf2?: string }) {
  return (
    <G transform={T(x, y, s)}>
      <Path d="M-26 0 C-18 -10 -14 -30 -10 -60 L-8 -230 L8 -230 L10 -60 C14 -30 18 -10 26 0 Z" fill={trunk} />
      <Path d="M4 0 C8 -20 6 -60 6 -230 L8 -230 L10 -60 C14 -30 18 -10 26 0 Z" fill={trunk2} opacity={0.7} />
      <Path d="M-8 -150 C-30 -160 -50 -150 -60 -128 M8 -110 C28 -118 46 -108 56 -88" stroke={trunk} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Ellipse cx={0} cy={-236} rx={70} ry={34} fill={leaf} />
      <Ellipse cx={-34} cy={-220} rx={40} ry={24} fill={leaf2} />
      <Ellipse cx={38} cy={-224} rx={36} ry={22} fill={leaf2} />
    </G>
  );
}

export function Palm({ x, y, s = 1, lean = 14, trunk = '#7A5532', leaf = '#1E8A4C', leaf2 = '#47C97A' }: { x: number; y: number; s?: number; lean?: number; trunk?: string; leaf?: string; leaf2?: string }) {
  const tx = lean * 1.4;
  const ty = -92;
  return (
    <G transform={T(x, y, s)}>
      <Path d={`M0 0 Q${lean} -46 ${tx} ${ty}`} stroke={trunk} strokeWidth={6} fill="none" strokeLinecap="round" />
      {[-172, -142, -112, -78, -42, -10, 18].map((a) => {
        const r = (a * Math.PI) / 180;
        const ex = tx + Math.cos(r) * 54;
        const ey = ty + Math.sin(r) * 30 + 18;
        const cx = tx + Math.cos(r) * 30;
        const cy = ty + Math.sin(r) * 30 - 14;
        const d = `M${tx} ${ty} Q${cx} ${cy} ${ex} ${ey}`;
        return (
          <G key={a}>
            <Path d={d} stroke={leaf} strokeWidth={7} fill="none" strokeLinecap="round" />
            <Path d={d} stroke={leaf2} strokeWidth={2} fill="none" strokeLinecap="round" />
          </G>
        );
      })}
      <Circle cx={tx - 3} cy={ty + 4} r={3.5} fill="#5A3B1E" />
      <Circle cx={tx + 3} cy={ty + 5} r={3.5} fill="#5A3B1E" />
    </G>
  );
}

export function BroadLeaf({ x, y, s = 1, rot = 0, c1 = '#0F6B45', c2 = '#1F9A62' }: { x: number; y: number; s?: number; rot?: number; c1?: string; c2?: string }) {
  return (
    <G transform={`${T(x, y, s)} rotate(${rot})`}>
      <Path d="M0 0 C-26 -30 -18 -84 0 -108 C18 -84 26 -30 0 0 Z" fill={c1} />
      <Path d="M0 0 C6 -30 8 -84 0 -108 C18 -84 26 -30 0 0 Z" fill={c2} opacity={0.65} />
      <Path d="M0 0 L0 -100" stroke="#0A3A28" strokeWidth={1.4} opacity={0.6} />
    </G>
  );
}

export function Vine({ x, y, len, c = '#1D7A4C', seed = 1 }: { x: number; y: number; len: number; c?: string; seed?: number }) {
  const r = rng(seed);
  const sway = 6 + r() * 8;
  return (
    <G>
      <Path d={`M${x} ${y} C${x + sway} ${y + len * 0.3}, ${x - sway} ${y + len * 0.65}, ${x + 2} ${y + len}`} stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <Ellipse key={i} cx={x + (i % 2 ? 4 : -4) + (f > 0.6 ? 0 : sway * 0.2)} cy={y + len * f} rx={4.5} ry={2.4} fill={c} transform={`rotate(${i % 2 ? 35 : -35} ${x} ${y + len * f})`} />
      ))}
    </G>
  );
}

export function Rock({ x, y, s = 1, c1 = '#5C6B63', c2 = '#44514B', moss = '#2E8A55' }: { x: number; y: number; s?: number; c1?: string; c2?: string; moss?: string | null }) {
  return (
    <G transform={T(x, y, s)}>
      <Polygon points="-24,0 -20,-15 -7,-24 9,-21 22,-9 26,0" fill={c1} />
      <Polygon points="6,-21 22,-9 26,0 4,0" fill={c2} opacity={0.75} />
      {moss && <Ellipse cx={-4} cy={-21} rx={14} ry={4.5} fill={moss} />}
      {moss && <Ellipse cx={-14} cy={-14} rx={6} ry={3} fill={moss} opacity={0.8} />}
    </G>
  );
}

export function Crystal({ x, y, s = 1, c1 = '#7EE7FF', c2 = '#3A9BE8', glow }: { x: number; y: number; s?: number; c1?: string; c2?: string; glow?: string }) {
  return (
    <G transform={T(x, y, s)}>
      {glow && <Glow cx={0} cy={-26} r={46} color={glow} />}
      <Polygon points="-18,0 -14,-24 -8,-14 -6,0" fill={c2} />
      <Polygon points="-8,0 -4,-52 4,-62 10,-44 12,0" fill={c1} />
      <Polygon points="4,-62 10,-44 12,0 4,0" fill={c2} opacity={0.6} />
      <Polygon points="12,0 16,-30 24,-18 22,0" fill={c2} />
      <Line x1={-2} y1={-48} x2={0} y2={-10} stroke="#FFFFFF" strokeWidth={1.2} opacity={0.65} />
    </G>
  );
}

// A floating island: grass top, hanging rock, optional vines and a little tree.
export function Island({ x, y, w = 80, rock = '#5C4A8A', rock2 = '#3E3162', grass = '#4FB36F', tree = true, vines = true, seed = 3 }: { x: number; y: number; w?: number; rock?: string; rock2?: string; grass?: string; tree?: boolean; vines?: boolean; seed?: number }) {
  const r = rng(seed);
  return (
    <G>
      <Path d={`M${x - w / 2} ${y} Q${x} ${y - 14} ${x + w / 2} ${y} L${x + w * 0.22} ${y + w * 0.42} Q${x} ${y + w * 0.78} ${x - w * 0.24} ${y + w * 0.4} Z`} fill={rock} />
      <Path d={`M${x + 4} ${y - 8} L${x + w / 2} ${y} L${x + w * 0.22} ${y + w * 0.42} Q${x + 6} ${y + w * 0.6} ${x + 2} ${y + w * 0.5} Z`} fill={rock2} opacity={0.7} />
      <Ellipse cx={x} cy={y - 2} rx={w / 2} ry={9} fill={grass} />
      <Ellipse cx={x - w * 0.12} cy={y - 5} rx={w * 0.28} ry={4} fill="#FFFFFF" opacity={0.12} />
      {tree && <Tree x={x - w * 0.22 + r() * 8} y={y - 4} s={0.42} />}
      {vines && [-0.3, -0.05, 0.22].map((f, i) => <Vine key={i} x={x + w * f} y={y + 4} len={14 + r() * 16} c="#2E9A5A" seed={seed + i} />)}
    </G>
  );
}

export function Lantern({ x, y, s = 1, color = '#FFC24D' }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <G transform={T(x, y, s)}>
      <Glow cx={0} cy={-22} r={22} color={color} />
      <Rect x={-1} y={-20} width={2} height={20} fill="#4A3426" />
      <Rect x={-4} y={-30} width={8} height={11} rx={2} fill={color} />
      <Rect x={-5} y={-32} width={10} height={3} fill="#4A3426" />
    </G>
  );
}

// Mossy ledge that landmarks stand on.
export function Terrace({ x, y, rx = 78, top = '#3FA46A', face = '#1B4A3C', face2 = '#12352C' }: { x: number; y: number; rx?: number; top?: string; face?: string; face2?: string }) {
  return (
    <G>
      <Path d={`M${x - rx} ${y} L${x - rx + 6} ${y + 26} Q${x} ${y + 40} ${x + rx - 6} ${y + 26} L${x + rx} ${y} Z`} fill={face} />
      <Path d={`M${x + rx * 0.2} ${y + 8} L${x + rx - 6} ${y + 26} L${x + rx} ${y} Z`} fill={face2} opacity={0.7} />
      <Ellipse cx={x} cy={y} rx={rx} ry={19} fill={top} />
      <Ellipse cx={x - rx * 0.2} cy={y - 3} rx={rx * 0.62} ry={11} fill="#FFFFFF" opacity={0.1} />
    </G>
  );
}

export function Tent({ x, y, s = 1, body = '#D9B27A', flap = '#B98A52', stripe = '#C44B3A' }: { x: number; y: number; s?: number; body?: string; flap?: string; stripe?: string }) {
  return (
    <G transform={T(x, y, s)}>
      <Polygon points="-24,0 0,-34 24,0" fill={body} />
      <Polygon points="0,-34 24,0 8,0" fill={flap} />
      <Polygon points="-7,0 0,-16 7,0" fill="#3B2A1C" />
      <Line x1={0} y1={-34} x2={0} y2={-42} stroke="#3B2A1C" strokeWidth={1.6} />
      <Polygon points="0,-42 12,-39 0,-35" fill={stripe} />
    </G>
  );
}
