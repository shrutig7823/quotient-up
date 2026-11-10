import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { Glow, Hills, Lantern, Palm, Rock } from '../art';
import { Layer, Loop, Rising } from '../fx';
import { Sky, makeRoute, scatter, type World } from './kit';

// Desert oasis: golden dunes, palms, sandstone arches, buried libraries, lantern-lit ruins.
export const verbal: World = {
  slug: 'verbal',
  env: 'Desert oasis',
  route: makeRoute([250, 150, 300, 200, 90, 180, 290, 120, 230, 300]),
  amp: 12,
  trail: { under: '#6E3B1E', w: 16, stone: '#B98A52', top: '#EBC684', dash: '10 4', glow: '#FFD36B', glowDash: '2 12' },
  bridges: [],
  node: { fill: '#F0D39A', rim: '#B1773F', text: '#4A2A12', shape: 'octagon' },
  accent: '#FFC24D',
  scrim: 'rgba(48,22,12,0.78)',
  Far: ({ k }) => (
    <Layer k={k}>
      <Sky id="vsky" stops={[[0, '#2A1A5E'], [0.22, '#8F3F6B'], [0.45, '#E0663B'], [0.7, '#FFB866'], [1, '#FFD98A']]} />
      <Glow cx={200} cy={640} r={260} color="#FFE2A0" />
      <Circle cx={200} cy={640} r={46} fill="#FFF1C4" />
      <Hills y={720} amp={24} seed={4} fill="#C76A4A" wave={0.02} />
      <Hills y={820} amp={26} seed={6} fill="#D9894F" wave={0.025} />
      <Hills y={930} amp={28} seed={8} fill="#E8A860" wave={0.03} />
    </Layer>
  ),
  Mid: ({ k, samples }) => {
    const palms = scatter(4, 16, samples, 40, [0, 400], [900, 1460]);
    const lamps = [3, 5, 7].map((i) => samples[Math.min(samples.length - 1, i * 28)]);
    return (
      <>
        <Layer k={k}>
          <Hills y={1010} amp={28} seed={10} fill="#EEBA6B" wave={0.028} />
          <Hills y={1130} amp={30} seed={12} fill="#E3A655" wave={0.034} />
          <Hills y={1260} amp={26} seed={14} fill="#D69145" wave={0.04} />
          <Hills y={1380} amp={20} seed={16} fill="#C27B38" wave={0.05} />
          {[1040, 1170, 1300].map((y, i) => (
            <Path key={y} d={`M-10 ${y + 20} Q100 ${y - 4 + i * 4} 210 ${y + 14} T410 ${y + 6}`} stroke="#FFF1C9" strokeWidth={1.2} fill="none" opacity={0.35} />
          ))}
          {/* oasis pool */}
          <Ellipse cx={86} cy={1230} rx={64} ry={20} fill="#1E8C7E" />
          <Ellipse cx={86} cy={1228} rx={56} ry={15} fill="#2AC8C0" />
          <Ellipse cx={74} cy={1225} rx={26} ry={5} fill="#B8FFF4" opacity={0.7} />
          {/* sandstone arches */}
          {[[310, 1000, 1.1], [70, 640, 0.9], [330, 470, 0.8]].map(([x, y, s], i) => (
            <G key={i} transform={`translate(${x} ${y}) scale(${s})`}>
              <Path d="M-34 0 L-34 -52 Q0 -92 34 -52 L34 0 L22 0 L22 -48 Q0 -76 -22 -48 L-22 0 Z" fill="#C98A52" />
              <Path d="M0 -76 Q22 -76 22 -48 L34 -52 Q34 -92 0 -92 Z" fill="#A86F3E" opacity={0.7} />
            </G>
          ))}
          {/* buried library: half-sunk columns and book spines */}
          {[[330, 760], [60, 1000]].map(([x, y], i) => (
            <G key={i}>
              <Rect x={x - 26} y={y - 30} width={9} height={30} fill="#D9A56A" />
              <Rect x={x - 6} y={y - 40} width={9} height={40} fill="#C98A52" />
              <Rect x={x + 14} y={y - 24} width={9} height={24} fill="#D9A56A" />
              {['#C0392B', '#2E86C1', '#F1C40F', '#27AE60'].map((c, j) => <Rect key={c} x={x - 30 + j * 11} y={y - 4 - (j % 2) * 3} width={8} height={8} fill={c} />)}
              <Ellipse cx={x} cy={y + 2} rx={40} ry={8} fill="#E3A655" />
            </G>
          ))}
          {palms.map(([x, y], i) => <Palm key={i} x={x} y={y} s={0.5 + (y / 1500) * 0.5} lean={x < 200 ? 12 : -12} trunk="#8A5A32" leaf="#2E8A45" leaf2="#6FD27A" />)}
          {scatter(5, 8, samples, 28, [0, 400], [700, 1470]).map(([x, y], i) => <Rock key={'r' + i} x={x} y={y} s={0.9} c1="#C98A52" c2="#A06A3A" moss={null} />)}
          {lamps.map((p, i) => <Lantern key={i} x={p.x + (i % 2 ? 22 : -22)} y={p.y + 4} s={1} />)}
        </Layer>
      </>
    );
  },
  Fore: ({ k }) => (
    <>
      <Loop dx={-34 * k} ms={9000}>
        <Layer k={k}>
          {Array.from({ length: 14 }, (_, i) => (
            <Line key={i} x1={20 + i * 34} y1={760 + ((i * 97) % 640)} x2={46 + i * 34} y2={764 + ((i * 97) % 640)} stroke="#FFF1C9" strokeWidth={1.2} opacity={0.4} />
          ))}
        </Layer>
      </Loop>
      <Layer k={k}>
        <Hills y={1462} amp={10} seed={18} fill="#9A5E2A" wave={0.04} />
        <Palm x={22} y={1500} s={1.7} lean={20} trunk="#7A4A26" leaf="#2E8A45" leaf2="#6FD27A" />
      </Layer>
      <Rising k={k} area={[0, 900, 400, 1450]} n={22} color="#FFE7A3" dy={-50} dx={46} seed={19} ms={7000} />
    </>
  ),
};
