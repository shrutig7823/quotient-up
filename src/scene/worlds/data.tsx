import { Ellipse, G, Polygon } from 'react-native-svg';

import { Cloud, Crystal, Glow, Hills, Ridge, Rock, Stars } from '../art';
import { Layer, Loop, Mist, Rising, Waterfall } from '../fx';
import { Sky, makeRoute, scatter, type World } from './kit';

// Crystal highlands: glacial peaks, luminous crystals, blue lakes, a glacial waterfall.
export const data: World = {
  slug: 'data',
  env: 'Crystal highlands',
  route: makeRoute([110, 200, 290, 250, 150, 90, 140, 230, 300, 220]),
  amp: 12,
  trail: { under: '#0B1B3A', w: 15, stone: '#7E9CC4', top: '#D5E8FF', dash: '9 4', glow: '#7EE7FF', glowDash: '2 12' },
  bridges: [],
  node: { fill: '#BFE6FF', rim: '#4C86C9', text: '#0C2347', shape: 'diamond' },
  accent: '#7EE7FF',
  scrim: 'rgba(5,16,42,0.78)',
  Far: ({ k }) => (
    <Layer k={k}>
      <Sky id="dsky" stops={[[0, '#050C26'], [0.25, '#12306A'], [0.55, '#3D78C0'], [1, '#9ED0F5']]} />
      <Stars seed={21} n={80} h={600} />
      <Ellipse cx={210} cy={260} rx={260} ry={46} fill="#4EF0D0" opacity={0.1} />
      <Ellipse cx={170} cy={310} rx={220} ry={30} fill="#9A7BFF" opacity={0.1} />
      <Ridge y={620} h={330} seed={31} fill="#1B3F82" peaks={5} snow="#EEF7FF" />
      <Ridge y={820} h={290} seed={33} fill="#2A5BA8" peaks={6} snow="#EEF7FF" opacity={0.95} />
      <Ridge y={1010} h={240} seed={35} fill="#3C78C4" peaks={5} snow="#F4FAFF" />
      <Cloud x={300} y={700} s={1.3} fill="#CFE6FF" opacity={0.5} />
    </Layer>
  ),
  Mid: ({ k, samples }) => {
    const crystals = scatter(7, 22, samples, 40, [0, 400], [340, 1460]);
    const lakes: [number, number, number][] = [[300, 1240, 50], [90, 880, 44], [310, 560, 42]];
    return (
      <>
        <Layer k={k}>
          <Hills y={1080} amp={20} seed={11} fill="#8DBDE8" />
          <Hills y={1220} amp={16} seed={13} fill="#6FA3D6" />
          <Hills y={1350} amp={12} seed={15} fill="#5589C2" />
          {lakes.map(([x, y, r], i) => (
            <G key={i}>
              <Ellipse cx={x} cy={y} rx={r * 1.3} ry={r * 0.42} fill="#1E5FA8" />
              <Ellipse cx={x} cy={y - 1} rx={r * 1.15} ry={r * 0.34} fill="#3AA6F0" />
              <Ellipse cx={x - r * 0.25} cy={y - 3} rx={r * 0.6} ry={r * 0.12} fill="#D8F4FF" opacity={0.7} />
            </G>
          ))}
          <Polygon points="40,520 130,500 150,700 30,720" fill="#51709F" />
          <Polygon points="130,500 150,700 120,700" fill="#3C5784" />
          {crystals.map(([x, y], i) => (
            <Crystal key={i} x={x} y={y} s={0.5 + (y / 1500) * 0.7} c1={i % 3 ? '#7EE7FF' : '#B79CFF'} c2={i % 3 ? '#3A8FE0' : '#7A55D6'} glow={i % 4 === 0 ? '#7EE7FF' : undefined} />
          ))}
          {scatter(3, 9, samples, 28, [0, 400], [420, 1470]).map(([x, y], i) => <Rock key={'r' + i} x={x} y={y} s={0.85} c1="#61799C" c2="#455A7C" moss={null} />)}
        </Layer>
        <Waterfall k={k} x={52} y={524} w={18} h={160} base="#CFEFFF" />
        <Mist k={k} bands={[[1200, 24], [820, 22]]} color="#D8EEFF" o={0.15} />
      </>
    );
  },
  Fore: ({ k }) => (
    <>
      <Layer k={k}>
        <Crystal x={14} y={1500} s={2.4} c1="#7EE7FF" c2="#3A8FE0" glow="#7EE7FF" />
        <Crystal x={392} y={1500} s={2.1} c1="#B79CFF" c2="#7A55D6" glow="#B79CFF" />
        <Glow cx={200} cy={1500} r={200} color="#7EE7FF" o={0.35} />
      </Layer>
      <Loop dy={-8 * k} ms={4200}>
        <Layer k={k}>
          <Crystal x={72} y={1488} s={1.2} c1="#9AF0FF" c2="#4A9BE8" glow="#9AF0FF" />
        </Layer>
      </Loop>
      <Rising k={k} area={[20, 600, 380, 1450]} n={20} color="#C9F4FF" dy={-90} dx={12} seed={17} ms={9000} />
    </>
  ),
};
