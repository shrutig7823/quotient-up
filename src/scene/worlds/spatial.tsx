import { Polygon } from 'react-native-svg';

import { Cloud, Glow, Island, Stars, Vine, rng } from '../art';
import { Layer, Loop, Rising } from '../fx';
import { Sky, makeRoute, scatter, type World } from './kit';

// Floating jungle islands above a sea of cloud: hanging gardens, broken bridges, geometric shrines.
const ROUTE = makeRoute([200, 100, 300, 110, 290, 130, 270, 150, 250, 200]);

export const spatial: World = {
  slug: 'spatial',
  env: 'Floating jungle islands',
  route: ROUTE,
  amp: 12,
  // sparse planks with gaps: a bridge that has partly fallen away
  trail: { under: '#2C1A5E', w: 12, stone: '#8E7BC8', top: '#E4DAFF', dash: '5 22', glow: '#FF9BE0', glowDash: '2 14' },
  bridges: [],
  node: { fill: '#E4DAFF', rim: '#7A62C6', text: '#2A1B5C', shape: 'circle' },
  accent: '#FF9BE0',
  scrim: 'rgba(22,12,60,0.76)',
  Far: ({ k }) => (
    <Layer k={k}>
      <Sky id="ssky" stops={[[0, '#150C54'], [0.3, '#4B32B5'], [0.62, '#B46BD6'], [1, '#FFB6DE']]} />
      <Stars seed={31} n={70} h={700} />
      <Glow cx={320} cy={170} r={150} color="#FFD9F4" o={0.7} />
      {[[60, 360], [330, 520], [90, 760], [340, 940]].map(([x, y], i) => (
        <Island key={i} x={x} y={y} w={56} rock="#4B3A98" rock2="#3A2C80" grass="#5A52C0" tree={false} vines={false} seed={i + 40} />
      ))}
      <Cloud x={70} y={1180} s={2.2} fill="#FFD9F4" opacity={0.55} />
      <Cloud x={330} y={1230} s={2.4} fill="#FFE6FA" opacity={0.6} />
    </Layer>
  ),
  Mid: ({ k, samples }) => {
    const r = rng(8);
    const rocks = scatter(2, 10, samples, 36, [10, 390], [330, 1460]);
    return (
      <Layer k={k}>
        {/* a floating island under every level stop */}
        {ROUTE.slice(0, 20).map(([x, y], i) => (
          <Island key={i} x={x} y={y + 10} w={64 + (i % 3) * 6} seed={i + 3} tree={i % 2 === 0} />
        ))}
        {/* geometric shrines and floating stone chunks */}
        {rocks.map(([x, y], i) => (
          <Polygon key={i} points={i % 2 ? `${x},${y - 14} ${x + 14},${y + 8} ${x - 14},${y + 8}` : `${x - 10},${y - 10} ${x + 10},${y - 10} ${x + 10},${y + 10} ${x - 10},${y + 10}`}
            fill={i % 3 ? '#B7ABE0' : '#9A8BD0'} opacity={0.85} transform={`rotate(${r() * 40 - 20} ${x} ${y})`} />
        ))}
        {[[40, 880, 30], [364, 1090, 26], [36, 440, 24]].map(([x, y, h], i) => <Vine key={i} x={x} y={y} len={h * 2} c="#3DBB74" seed={i + 60} />)}
      </Layer>
    );
  },
  Fore: ({ k }) => (
    <>
      <Loop dx={26 * k} ms={14000}>
        <Layer k={k}>
          <Cloud x={50} y={1400} s={2.4} fill="#FFE6FA" opacity={0.8} />
          <Cloud x={300} y={1450} s={2.8} fill="#FFD9F4" opacity={0.85} />
          <Cloud x={160} y={1480} s={3} fill="#FFFFFF" opacity={0.8} />
        </Layer>
      </Loop>
      <Loop dx={-30 * k} ms={17000} delay={1200}>
        <Layer k={k}>
          <Cloud x={340} y={1000} s={1.4} fill="#FFE6FA" opacity={0.28} />
          <Cloud x={40} y={700} s={1.6} fill="#FFE6FA" opacity={0.25} />
        </Layer>
      </Loop>
      <Rising k={k} area={[10, 500, 390, 1400]} n={18} color="#FFE6FA" dy={-80} dx={20} seed={23} ms={9500} />
    </>
  ),
};
