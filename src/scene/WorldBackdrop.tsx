import type { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { SCENE_W } from './size';
import { getWorld } from './worlds';

// The world's sky and distant landscape, softened behind a calm scrim so questions stay easy to read.
export function WorldBackdrop({ slug, children }: { slug: string; children: ReactNode }) {
  const { width: winW } = useWindowDimensions();
  const world = getWorld(slug);
  const k = Math.max(winW, 420) / SCENE_W;
  return (
    <View style={{ flex: 1, backgroundColor: '#070B24' }}>
      {world && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', alignItems: 'center' }}>
          <View style={{ width: Math.max(winW, 420), top: -520 * k, height: 1500 * k }}>
            {world.Far({ k, samples: [], route: world.route })}
          </View>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: world.scrim }} />
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, backgroundColor: world.accent, opacity: 0.8 }} />
        </View>
      )}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
