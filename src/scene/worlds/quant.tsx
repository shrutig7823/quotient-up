import { Circle, Ellipse, G, Polygon } from 'react-native-svg';

import { BroadLeaf, Cloud, Glow, Hills, Palm, Ridge, Rock, Tree } from '../art';
import { Layer, Loop, Rising, Waterfall } from '../fx';
import { Sky, makeRoute, scatter, type World } from './kit';

// Tropical jungle: bright sun, turquoise pools, palms, broad leaves, a waterfall, ancient stone steps.
export const quant: World = {
  slug: 'quant',
  env: 'Tropical jungle',
  route: makeRoute([190, 110, 250, 120, 285, 150, 100, 230, 290, 170]),
  amp: 12,
  trail: { under: '#12452F', w: 15, stone: '#8D856F', top: '#CFC5A6', dash: '9 4', glow: '#FFE27A', glowDash: '2 12' },
  bridges: [],
  node: { fill: '#CBBF9F', rim: '#8A7F63', text: '#2A2418', shape: 'circle' },
  accent: '#FFB347',
  scrim: 'rgba(7,40,34,0.74)',
  Far: ({ k }) => (
    <Layer k={k}>
      <Sky id="qsky" stops={[[0, '#58CFE6'], [0.3, '#9BEBDD'], [0.6, '#E8F7C4'], [1, '#FFE9A0']]} />
      <Glow cx={320} cy={150} r={200} color="#FFF3B0" />
      <Circle cx={320} cy={150} r={34} fill="#FFFBE0" />
      <Cloud x={80} y={190} s={1.3} opacity={0.95} />
      <Cloud x={250} y={330} s={1} opacity={0.9} />
      <Cloud x={60} y={520} s={1.5} opacity={0.85} />
      <Ridge y={760} h={220} seed={4} fill="#58C2A6" peaks={6} opacity={0.75} />
      <Ridge y={900} h={200} seed={8} fill="#3FAE8C" peaks={5} opacity={0.85} />
      <Hills y={1010} amp={26} seed={2} fill="#33A27A" />
    </Layer>
  ),
  Mid: ({ k, samples }) => {
    const trees = scatter(5, 54, samples, 44, [-10, 410], [300, 1480]);
    const pools: [number, number, number][] = [[78, 1010, 46], [326, 700, 40], [80, 470, 38], [318, 1270, 38]];
    return (
      <>
        <Layer k={k}>
          <Hills y={1070} amp={22} seed={7} fill="#2C9468" />
          <Hills y={1210} amp={18} seed={3} fill="#238156" />
          <Hills y={1340} amp={14} seed={1} fill="#1B6B47" />
          {pools.map(([x, y, r], i) => (
            <G key={i}>
              <Ellipse cx={x} cy={y} rx={r * 1.25} ry={r * 0.42} fill="#176E5D" />
              <Ellipse cx={x} cy={y - 1} rx={r * 1.1} ry={r * 0.34} fill="#22CFC4" />
              <Ellipse cx={x - r * 0.2} cy={y - 3} rx={r * 0.6} ry={r * 0.14} fill="#9CF7EE" opacity={0.7} />
              <Ellipse cx={x + r * 0.5} cy={y + 2} rx={r * 0.18} ry={r * 0.07} fill="#FFFFFF" opacity={0.6} />
            </G>
          ))}
          <Polygon points="300,560 400,540 400,700 330,700" fill="#4F5F49" />
          <Polygon points="330,700 400,700 400,720 326,716" fill="#3C4A39" />
          {trees.map(([x, y], i) =>
            i % 3 === 0 ? (
              <Palm key={i} x={x} y={y} s={0.55 + (y / 1500) * 0.5} lean={x < 200 ? 12 : -12} />
            ) : (
              <Tree key={i} x={x} y={y} s={0.45 + (y / 1500) * 0.6} dark="#14683F" mid="#22A05C" light="#4FD283" />
            ),
          )}
          {scatter(9, 12, samples, 30, [0, 400], [320, 1470]).map(([x, y], i) => (
            <BroadLeaf key={'l' + i} x={x} y={y} s={0.42} rot={(i % 2 ? 1 : -1) * (10 + i * 7)} c1="#16824A" c2="#42C778" />
          ))}
          {scatter(13, 7, samples, 26, [0, 400], [400, 1470]).map(([x, y], i) => <Rock key={'r' + i} x={x} y={y} s={0.8} c1="#6F7A68" c2="#52604F" moss="#38A85F" />)}
        </Layer>
        <Waterfall k={k} x={338} y={564} w={16} h={140} base="#B6FFF6" />
      </>
    );
  },
  Fore: ({ k }) => (
    <>
      <Layer k={k}>
        {[210, 130].map((a, i) => (
          <Polygon key={i} points={`${a},0 ${a + 60},0 ${a + 260},1500 ${a + 120},1500`} fill="#FFFFFF" opacity={0.06} />
        ))}
      </Layer>
      <Loop rot={1.1} ms={7200} style={{ transformOrigin: 'left bottom' } as any}>
        <Layer k={k}>
          <BroadLeaf x={-6} y={1510} s={1.8} rot={28} c1="#0D6B3E" c2="#2FB36A" />
          <BroadLeaf x={26} y={1520} s={1.4} rot={50} c1="#168A4E" c2="#52D286" />
          <Palm x={34} y={1500} s={1.5} lean={22} />
        </Layer>
      </Loop>
      <Loop rot={-1.1} ms={8600} delay={900} style={{ transformOrigin: 'right bottom' } as any}>
        <Layer k={k}>
          <BroadLeaf x={406} y={1510} s={1.8} rot={-28} c1="#0D6B3E" c2="#2FB36A" />
          <BroadLeaf x={374} y={1520} s={1.4} rot={-50} c1="#168A4E" c2="#52D286" />
        </Layer>
      </Loop>
      <Rising k={k} area={[40, 700, 360, 1400]} n={14} color="#FFF3A8" dy={-70} dx={16} seed={5} ms={8000} />
    </>
  ),
};
