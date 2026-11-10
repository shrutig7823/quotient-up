import { G, Path, Polygon } from 'react-native-svg';

import { Cloud, Glow, Hills, Rock, Stars, Tent, Tree } from '../art';
import { Layer, Loop, Rising } from '../fx';
import { Sky, makeRoute, scatter, type World } from './kit';

// Volcanic wilderness: dark rock, lush vegetation, glowing lava streams, expedition camps, dramatic sky.
export const applied: World = {
  slug: 'applied',
  env: 'Volcanic wilderness',
  route: makeRoute([150, 260, 120, 290, 200, 100, 270, 160, 300, 200]),
  amp: 12,
  trail: { under: '#12090F', w: 15, stone: '#4A3B4D', top: '#8A6F85', dash: '9 4', glow: '#FF8A3D', glowDash: '2 11' },
  bridges: [],
  node: { fill: '#6E5A72', rim: '#FF7A33', text: '#FFF1E0', shape: 'octagon' },
  accent: '#FF8A3D',
  scrim: 'rgba(24,8,16,0.8)',
  Far: ({ k }) => (
    <Layer k={k}>
      <Sky id="asky" stops={[[0, '#0E0618'], [0.28, '#3A1030'], [0.55, '#9B2B34'], [0.8, '#E4602B'], [1, '#FFA14A']]} />
      <Stars seed={41} n={40} h={500} color="#FFD7B0" />
      <Glow cx={110} cy={700} r={170} color="#FF7A33" />
      <Glow cx={310} cy={620} r={150} color="#FF9A4A" />
      <Polygon points="-10,900 50,720 92,690 130,716 200,900" fill="#2A1226" />
      <Polygon points="220,900 270,660 300,640 332,664 410,900" fill="#2A1226" />
      <Polygon points="86,694 110,676 132,716" fill="#FF6A2A" opacity={0.9} />
      <Polygon points="290,646 308,628 328,664" fill="#FF8A3D" opacity={0.9} />
      <Cloud x={60} y={470} s={1.8} fill="#4A2A44" opacity={0.7} />
      <Cloud x={300} y={380} s={2} fill="#3A1E3E" opacity={0.75} />
      <Cloud x={200} y={600} s={1.6} fill="#5A2E48" opacity={0.6} />
    </Layer>
  ),
  Mid: ({ k, samples }) => {
    const trees = scatter(6, 26, samples, 42, [0, 400], [940, 1470]);
    const camps = [4, 8].map((i) => samples[Math.min(samples.length - 1, i * 24)]);
    const lava = [
      'M60 940 C90 1010 40 1070 80 1140 S120 1260 90 1330',
      'M340 880 C310 960 360 1020 320 1100 S280 1220 330 1310',
      'M200 400 C170 460 230 520 190 590',
    ];
    return (
      <>
        <Layer k={k}>
          <Hills y={960} amp={22} seed={20} fill="#241520" />
          <Hills y={1100} amp={20} seed={22} fill="#1A0F18" />
          <Hills y={1260} amp={16} seed={24} fill="#130A12" />
          {lava.map((d, i) => (
            <G key={i}>
              <Path d={d} stroke="#FF5A1F" strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.28} />
              <Path d={d} stroke="#FF8A3D" strokeWidth={6} fill="none" strokeLinecap="round" />
              <Path d={d} stroke="#FFD38A" strokeWidth={2} fill="none" strokeLinecap="round" />
            </G>
          ))}
          {trees.map(([x, y], i) => <Tree key={i} x={x} y={y} s={0.45 + (y / 1500) * 0.5} dark="#0B3A22" mid="#15683A" light="#E8794A" />)}
          {scatter(7, 14, samples, 28, [0, 400], [900, 1470]).map(([x, y], i) => <Rock key={'r' + i} x={x} y={y} s={0.9 + (i % 3) * 0.2} c1="#3A2C3C" c2="#241926" moss="#1F6B3A" />)}
          {camps.map((p, i) => <Tent key={i} x={p.x + (i ? -34 : 34)} y={p.y + 6} s={0.95} body="#C9A06A" flap="#8A5A3A" stripe="#E74C3C" />)}
        </Layer>
        <Loop o0={0.55} o1={1} ms={2600}>
          <Layer k={k}>
            <Glow cx={60} cy={1100} r={60} color="#FF7A33" o={0.6} />
            <Glow cx={330} cy={1090} r={60} color="#FF7A33" o={0.6} />
            <Glow cx={200} cy={520} r={44} color="#FF7A33" o={0.6} />
          </Layer>
        </Loop>
      </>
    );
  },
  Fore: ({ k }) => (
    <>
      <Layer k={k}>
        <Polygon points="-10,1500 -10,1380 40,1420 90,1470 120,1500" fill="#0B060C" />
        <Polygon points="410,1500 410,1370 360,1415 310,1470 280,1500" fill="#0B060C" />
        <Tree x={26} y={1470} s={1.7} dark="#082A18" mid="#0F5230" light="#E8794A" />
      </Layer>
      <Rising k={k} area={[10, 900, 390, 1480]} n={28} color="#FF8A3D" dy={-130} dx={26} seed={29} ms={6500} />
      <Rising k={k} area={[10, 1000, 390, 1480]} n={16} color="#FFD38A" dy={-90} dx={-18} seed={31} ms={8200} />
    </>
  ),
};
