import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { Cloud, Crystal, Glow, Island, Lantern, Tent, Vine } from './art';
import { font } from '@/ui/theme';

// Landmark art. Each is drawn around (x, y) = ground centre, roughly 100 units wide.
//  lit  = the playable destination (warm gold light)
//  done = restored/completed (turquoise magic)
//  dim  = coming soon (visible, unlit, never looks "locked")
export type LM = { x: number; y: number; s?: number; lit?: boolean; dim?: boolean; done?: boolean };

const GOLD = '#FFC94D';
const TURQ = '#5FF2E0';

function Frame({ x, y, s = 1, dim, children }: LM & { children: ReactNode }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} opacity={dim ? 0.8 : 1}>
      {children}
    </G>
  );
}

const aura = (lit?: boolean, done?: boolean, cy = -40, r = 74) =>
  lit ? <Glow cx={0} cy={cy} r={r} color={GOLD} /> : done ? <Glow cx={0} cy={cy} r={r * 0.85} color={TURQ} /> : null;

// Quant: ancient stone gateway with glowing maths symbols.
export function QuantGate(p: LM) {
  const door = p.lit ? '#FFD770' : p.done ? '#47E8D8' : '#14173A';
  const sym = p.dim ? '#7FA6B4' : TURQ;
  return (
    <Frame {...p}>
      {aura(p.lit, p.done)}
      <Rect x={-48} y={-6} width={96} height={6} rx={2} fill="#6E675B" />
      <Rect x={-42} y={-12} width={84} height={6} fill="#877F6D" />
      <Rect x={-38} y={-76} width={17} height={64} fill="#A59D88" />
      <Rect x={21} y={-76} width={17} height={64} fill="#968E7A" />
      {[-60, -44, -28].map((yy) => (
        <G key={yy}>
          <Line x1={-38} y1={yy} x2={-21} y2={yy} stroke="#7A725F" strokeWidth={1} />
          <Line x1={21} y1={yy} x2={38} y2={yy} stroke="#7A725F" strokeWidth={1} />
        </G>
      ))}
      <Path d="M-42 -74 Q0 -122 42 -74 L42 -64 Q0 -108 -42 -64 Z" fill="#B7AF99" />
      <Path d="M-21 -12 L-21 -54 Q0 -84 21 -54 L21 -12 Z" fill={door} />
      {(p.lit || p.done) && <Path d="M-21 -12 L-21 -54 Q0 -84 21 -54 L21 -12 Z" fill="#FFFFFF" opacity={0.18} />}
      <SvgText x={-29.5} y={-40} fontSize={13} fontFamily={font.heavy} fill={sym} textAnchor="middle">+</SvgText>
      <SvgText x={29.5} y={-40} fontSize={14} fontFamily={font.heavy} fill={sym} textAnchor="middle">×</SvgText>
      <SvgText x={0} y={-82} fontSize={15} fontFamily={font.heavy} fill={sym} textAnchor="middle">π</SvgText>
      <SvgText x={-29.5} y={-22} fontSize={12} fontFamily={font.heavy} fill={sym} textAnchor="middle">÷</SvgText>
      <SvgText x={29.5} y={-22} fontSize={12} fontFamily={font.heavy} fill={sym} textAnchor="middle">=</SvgText>
    </Frame>
  );
}

// Logic: vine-covered maze ruin.
export function LogicMaze(p: LM) {
  const wall = p.dim ? '#5E6B58' : '#6E7F62';
  return (
    <Frame {...p}>
      {aura(p.lit, p.done, -30, 70)}
      <Ellipse cx={0} cy={-2} rx={52} ry={9} fill="#2F5A3D" />
      <Path d="M-46 -4 L-46 -50 L46 -50 L46 -22 L10 -22 L10 -38 L-10 -38 L-10 -14 L-30 -14 L-30 -4" stroke="#44503F" strokeWidth={13} fill="none" strokeLinejoin="round" />
      <Path d="M-46 -4 L-46 -50 L46 -50 L46 -22 L10 -22 L10 -38 L-10 -38 L-10 -14 L-30 -14 L-30 -4" stroke={wall} strokeWidth={9} fill="none" strokeLinejoin="round" />
      <Path d="M-46 -52 L-46 -50 L46 -50" stroke="#8FB57A" strokeWidth={3} fill="none" opacity={0.8} />
      <Rect x={26} y={-86} width={14} height={36} fill="#67775C" />
      <Path d="M22 -86 L44 -86 L40 -94 L26 -94 Z" fill="#7C8E6E" />
      <Path d="M-6 -86 Q8 -112 24 -86" stroke="#7C8E6E" strokeWidth={6} fill="none" />
      <Vine x={-38} y={-52} len={34} c="#2FA05C" seed={2} />
      <Vine x={-8} y={-50} len={22} c="#2FA05C" seed={5} />
      <Vine x={32} y={-50} len={30} c="#3DB86C" seed={8} />
      <Vine x={34} y={-88} len={30} c="#2FA05C" seed={11} />
      {(p.lit || p.done) && <Circle cx={0} cy={-26} r={4} fill={p.lit ? GOLD : TURQ} />}
    </Frame>
  );
}

// Data: crystal observatory with luminous columns.
export function DataObservatory(p: LM) {
  const c1 = p.dim ? '#8FB6D8' : '#7EE7FF';
  return (
    <Frame {...p}>
      {aura(p.lit, p.done, -44, 76)}
      {!p.lit && !p.done && <Glow cx={0} cy={-40} r={50} color="#6FD3FF" o={p.dim ? 0.5 : 1} />}
      <Ellipse cx={0} cy={0} rx={52} ry={9} fill="#51648A" />
      <Crystal x={-38} y={0} s={0.95} c1={c1} c2="#3A83D8" />
      <Crystal x={40} y={0} s={0.8} c1={c1} c2="#3A83D8" />
      <Rect x={-26} y={-28} width={52} height={28} fill="#8EA6CE" />
      <Rect x={-26} y={-28} width={52} height={5} fill="#A9BFE2" />
      <Path d="M-27 -28 A27 27 0 0 1 27 -28 Z" fill="#D5E6FF" />
      <Path d="M-4 -52 L4 -52 L4 -28 L-4 -28 Z" fill="#2B3F73" />
      <Line x1={8} y1={-44} x2={34} y2={-76} stroke="#EAF3FF" strokeWidth={5} strokeLinecap="round" />
      <Circle cx={36} cy={-79} r={3} fill={p.lit ? GOLD : '#BDEBFF'} />
      <Path d="M-8 0 L-8 -14 Q0 -22 8 -14 L8 0 Z" fill={p.lit ? '#FFD770' : '#1B2A55'} />
    </Frame>
  );
}

// Verbal: hidden library carved into the rock.
export function VerbalLibrary(p: LM) {
  return (
    <Frame {...p}>
      {aura(p.lit, p.done, -34, 72)}
      <Polygon points="-56,0 -50,-30 -30,-58 -6,-72 22,-66 44,-44 56,0" fill="#B07A47" />
      <Polygon points="10,-68 44,-44 56,0 14,0" fill="#8F5F36" opacity={0.7} />
      <Path d="M-22 0 L-22 -34 Q0 -62 22 -34 L22 0 Z" fill="#6B4527" />
      <Path d="M-16 0 L-16 -32 Q0 -54 16 -32 L16 0 Z" fill={p.lit ? '#FFC873' : p.done ? '#6FE9D8' : '#2A1B12'} />
      {(p.lit || p.done) && [-10, -2, 6, 12].map((bx, i) => <Rect key={i} x={bx - 2} y={-24 + (i % 2) * 2} width={4} height={14} fill={['#C0392B', '#2E86C1', '#27AE60', '#F1C40F'][i]} />)}
      <Rect x={-26} y={-38} width={5} height={38} fill="#C9935C" />
      <Rect x={21} y={-38} width={5} height={38} fill="#C9935C" />
      <Lantern x={-40} y={0} s={0.7} color={p.dim ? '#C9A56B' : GOLD} />
      <Ellipse cx={0} cy={-2} rx={54} ry={5} fill="#3A2514" opacity={0.35} />
      <Rect x={38} y={-12} width={20} height={4} fill="#C0392B" />
      <Rect x={40} y={-16} width={17} height={4} fill="#2E86C1" />
    </Frame>
  );
}

// Spatial: floating stone puzzle shrine.
export function SpatialShrine(p: LM) {
  const glow = p.lit ? GOLD : p.done ? TURQ : '#B28CFF';
  return (
    <Frame {...p}>
      {aura(p.lit, p.done, -50, 74)}
      <Island x={0} y={0} w={92} rock="#6C5AA3" rock2="#483B78" grass="#58B97B" tree={false} vines seed={9} />
      <Polygon points="-12,-6 0,-14 12,-6 12,-26 0,-34 -12,-26" fill="#CFC6EA" />
      <Polygon points="0,-14 12,-6 12,-26 0,-34" fill="#A99DD0" />
      <Polygon points="-12,-26 0,-34 12,-26 0,-18" fill="#E6E0F7" />
      <Polygon points="-34,-52 -22,-74 -10,-52" fill="#B7ABE0" />
      <Polygon points="12,-58 30,-58 30,-76 12,-76" fill="#A99DD0" transform="rotate(12 21 -67)" />
      <Circle cx={0} cy={-56} r={16} stroke={glow} strokeWidth={2.4} fill="none" opacity={p.dim ? 0.55 : 0.95} />
      <Circle cx={0} cy={-56} r={4} fill={glow} />
    </Frame>
  );
}

// Applied: explorer's camp with maps and instruments.
export function AppliedCamp(p: LM) {
  return (
    <Frame {...p}>
      {aura(p.lit, p.done, -30, 70)}
      <Ellipse cx={0} cy={-1} rx={54} ry={9} fill="#4B3A2C" />
      <Tent x={-26} y={-2} s={1.25} />
      <Tent x={22} y={0} s={0.9} body="#C8A06A" flap="#A8804E" stripe="#2E86C1" />
      <Rect x={38} y={-30} width={22} height={4} fill="#6B4A2B" />
      <Line x1={42} y1={-26} x2={42} y2={-6} stroke="#6B4A2B" strokeWidth={3} />
      <Line x1={56} y1={-26} x2={56} y2={-6} stroke="#6B4A2B" strokeWidth={3} />
      <Rect x={40} y={-34} width={18} height={5} fill="#F0E2BC" />
      <Line x1={-2} y1={-6} x2={-8} y2={-46} stroke="#3B2A1C" strokeWidth={2.4} />
      <Line x1={-2} y1={-6} x2={6} y2={-46} stroke="#3B2A1C" strokeWidth={2.4} />
      <Circle cx={-1} cy={-50} r={6} fill="none" stroke="#E8D9A8" strokeWidth={2.4} />
      <Lantern x={-56} y={0} s={0.7} color={p.dim ? '#D69B5B' : '#FF9F43'} />
    </Frame>
  );
}

// The Summit: ancient temple and portal among clouds.
export function SummitTemple({ x, y, s = 1, open }: { x: number; y: number; s?: number; open?: boolean }) {
  const light = open ? GOLD : '#B9A2FF';
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Glow cx={0} cy={-64} r={126} color={open ? GOLD : '#C9B2FF'} />
      {[-46, -24, 0, 24, 46].map((a) => (
        <Polygon key={a} points={`0,-70 ${a * 2.4 - 8},-210 ${a * 2.4 + 8},-210`} fill={light} opacity={0.08} />
      ))}
      <Polygon points="-64,0 -52,-14 52,-14 64,0" fill="#6D6A86" />
      <Polygon points="-54,-14 -44,-26 44,-26 54,-14" fill="#8683A3" />
      <Polygon points="-44,-26 -34,-38 34,-38 44,-26" fill="#A5A2C0" />
      <Rect x={-30} y={-72} width={60} height={34} fill="#B9B6D2" />
      <Rect x={-36} y={-80} width={72} height={9} fill="#8683A3" />
      <Polygon points="-30,-80 0,-112 30,-80" fill="#7A77A0" />
      <Polygon points="0,-112 30,-80 0,-80" fill="#5F5C85" />
      <Rect x={-26} y={-72} width={7} height={34} fill="#D6D3EA" />
      <Rect x={19} y={-72} width={7} height={34} fill="#D6D3EA" />
      <Path d="M-12 -38 L-12 -58 Q0 -76 12 -58 L12 -38 Z" fill={open ? '#FFE8A0' : '#6F55D6'} />
      <Path d="M-12 -38 L-12 -58 Q0 -76 12 -58 L12 -38 Z" fill="#FFFFFF" opacity={0.22} />
      <Circle cx={0} cy={-122} r={5} fill={light} />
      <Circle cx={0} cy={-122} r={13} fill={light} opacity={0.3} />
      <Cloud x={-52} y={-4} s={1.1} fill="#E9E3FF" opacity={0.85} />
      <Cloud x={54} y={-2} s={1.25} fill="#E9E3FF" opacity={0.85} />
      <Cloud x={0} y={6} s={1.5} fill="#F4F0FF" opacity={0.9} />
    </G>
  );
}

export const LANDMARKS: Record<string, (p: LM) => ReactNode> = {
  quant: QuantGate,
  logic: LogicMaze,
  data: DataObservatory,
  verbal: VerbalLibrary,
  spatial: SpatialShrine,
  applied: AppliedCamp,
};
