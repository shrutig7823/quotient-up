import Svg from 'react-native-svg';

import { LANDMARKS } from '@/scene/landmarks';

// Small illustrated icon for a branch: its world's landmark, drawn at icon size.
export function MiniArt({ slug, size, lit }: { slug: string; size: number; lit: boolean }) {
  const Art = LANDMARKS[slug];
  return (
    <Svg width={size} height={size} viewBox="-64 -112 128 124">
      <Art x={0} y={0} s={1} lit={lit} />
    </Svg>
  );
}
