import { Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { BroadLeaf, Giant, Hills, Rock, Vine, rng } from '../art';
import { Fireflies, Layer, Loop, Mist } from '../fx';
import { Sky, makeRoute, scatter, type World } from './kit';

// Amazon rainforest: dense canopy, giant buttress roots, hanging vines, mist, rope bridges, hidden ruins.
export const logic: World = {
  slug: 'logic',
  env: 'Amazon rainforest',
  route: makeRoute([200, 290, 160, 100, 200, 300, 250, 140, 90, 200]),
  amp: 12,
  trail: { under: '#0A1F18', w: 15, stone: '#5E6A55', top: '#93A383', dash: '8 4', glow: '#7CFFB2', glowDash: '2 12', plank: '#7A5532', rope: '#C9B684' },
  bridges: [[4, 5], [12, 13]],
  node: { fill: '#8E9F7B', rim: '#4C5A44', text: '#0F1A12', shape: 'square' },
  accent: '#7CFFB2',
  scrim: 'rgba(3,22,16,0.8)',
  Far: ({ k }) => (
    <Layer k={k}>
      <Sky id="lsky" stops={[[0, '#03160F'], [0.35, '#073026'], [0.7, '#0B4A38'], [1, '#07281E']]} />
      {[40, 120, 215, 300, 370].map((x, i) => (
        <Rect key={x} x={x - 12} y={0} width={24 + (i % 2) * 10} height={1500} fill="#041F17" opacity={0.85} />
      ))}
      {[70, 190, 320].map((x) => (
        <Polygon key={x} points={`${x},0 ${x + 40},0 ${x + 150},1300 ${x + 40},1300`} fill="#C8FFA0" opacity={0.055} />
      ))}
    </Layer>
  ),
  Mid: ({ k, samples }) => {
    const r = rng(3);
    const giants = scatter(2, 9, samples, 70, [-20, 420], [600, 1500]);
    const ferns = scatter(8, 26, samples, 34, [0, 400], [320, 1480]);
    return (
      <>
        <Mist k={k} bands={[[1300, 30], [900, 26], [520, 26]]} color="#C8F0DC" o={0.13} />
        <Layer k={k}>
          <Hills y={1180} amp={20} seed={5} fill="#0B3427" />
          <Hills y={1320} amp={16} seed={9} fill="#08291F" />
          {giants.map(([x, y], i) => <Giant key={i} x={x} y={y} s={0.46 + (y / 1500) * 0.34} />)}
          {[-8, 408].map((x, i) => (
            <G key={x}>
              <Giant x={x} y={1500} s={1.1} />
              <Path d={`M${x} 1500 C${x + (i ? -40 : 40)} 1440 ${x + (i ? -80 : 80)} 1470 ${x + (i ? -120 : 120)} 1500`} stroke="#2A1F17" strokeWidth={14} fill="none" strokeLinecap="round" />
              <Path d={`M${x} 1470 C${x + (i ? -30 : 30)} 1420 ${x + (i ? -60 : 60)} 1440 ${x + (i ? -90 : 90)} 1480`} stroke="#3A2B20" strokeWidth={9} fill="none" strokeLinecap="round" />
            </G>
          ))}
          {/* hidden ruins: stacked, moss-covered blocks and a broken arch */}
          {[[64, 1120], [338, 840], [60, 520]].map(([x, y], i) => (
            <G key={i}>
              <Rect x={x - 24} y={y - 20} width={48} height={20} fill="#55634C" />
              <Rect x={x - 18} y={y - 40} width={36} height={20} fill="#6A7A5E" />
              <Rect x={x - 10} y={y - 58} width={22} height={18} fill="#55634C" />
              <Ellipse cx={x - 4} cy={y - 58} rx={12} ry={4} fill="#2E8A55" />
              <Path d={`M${x + 26} ${y} L${x + 26} ${y - 36} Q${x + 40} ${y - 56} ${x + 54} ${y - 36} L${x + 54} ${y}`} stroke="#6A7A5E" strokeWidth={7} fill="none" />
            </G>
          ))}
          {ferns.map(([x, y], i) => (
            <BroadLeaf key={i} x={x} y={y} s={0.36 + r() * 0.22} rot={(i % 2 ? 1 : -1) * (14 + r() * 40)} c1="#0A5A38" c2="#168A55" />
          ))}
          {scatter(6, 8, samples, 26, [0, 400], [400, 1470]).map(([x, y], i) => <Rock key={'r' + i} x={x} y={y} s={0.8} c1="#46564A" c2="#34423A" />)}
        </Layer>
      </>
    );
  },
  Fore: ({ k }) => (
    <>
      <Layer k={k}>
        {/* canopy and hanging vines across the top */}
        {[-10, 60, 140, 230, 310, 400].map((x, i) => (
          <BroadLeaf key={x} x={x} y={-6} s={1.3 + (i % 2) * 0.4} rot={180 + (i - 2.5) * 12} c1="#04301F" c2="#0B5A3A" />
        ))}
        {[24, 70, 128, 186, 250, 312, 372].map((x, i) => <Vine key={x} x={x} y={0} len={110 + (i % 3) * 70} c="#1E9A58" seed={i + 3} />)}
      </Layer>
      <Loop rot={0.9} ms={7600} style={{ transformOrigin: 'center top' } as any}>
        <Layer k={k}>
          {[40, 150, 270, 360].map((x, i) => <Vine key={x} x={x} y={0} len={170 + i * 30} c="#2DBB6C" seed={i + 20} />)}
        </Layer>
      </Loop>
      <Fireflies k={k} area={[20, 300, 380, 1450]} n={30} color="#C8FF8A" seed={9} />
    </>
  ),
};
