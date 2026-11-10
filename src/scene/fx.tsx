import { type ReactNode, useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse } from 'react-native-svg';

import { rng } from './art';

// A full-size transparent SVG in scene units, scaled by k (screen px per scene unit).
export function Layer({ k, W = 400, H = 1500, children }: { k: number; W?: number; H?: number; children: ReactNode }) {
  return (
    <Svg width={W * k} height={H * k} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {children}
    </Svg>
  );
}

// Gentle back-and-forth (or restart-loop) motion. With reduced motion on, it sits still.
export function Loop({
  children, dx = 0, dy = 0, rot = 0, o0 = 1, o1 = 1, ms = 6000, delay = 0, restart = false, fill = true, style,
}: {
  children: ReactNode; dx?: number; dy?: number; rot?: number; o0?: number; o1?: number; ms?: number; delay?: number; restart?: boolean; fill?: boolean; style?: ViewStyle;
}) {
  const calm = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    if (calm) {
      v.value = 0.5;
      return;
    }
    v.value = 0;
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: ms, easing: restart ? Easing.linear : Easing.inOut(Easing.sin) }), -1, !restart));
  }, [calm, ms, delay, restart, v]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: dx * v.value }, { translateY: dy * v.value }, { rotate: `${rot * v.value}deg` }],
    opacity: o0 + (o1 - o0) * v.value,
  }));
  const base: ViewStyle = fill ? { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 } : {};
  return (
    <Animated.View pointerEvents="none" style={[base, style, anim]}>
      {children}
    </Animated.View>
  );
}

// Slow drifting bands of mist.
export function Mist({ k, bands, color = '#CFE9E4', o = 0.16 }: { k: number; bands: [number, number][]; color?: string; o?: number }) {
  return (
    <>
      {[0, 1].map((layer) => (
        <Loop key={layer} dx={(layer ? -1 : 1) * 40 * k} ms={20000 + layer * 7000} delay={layer * 2500}>
          {/* Wider than the scene so the drifting layer never shows an edge. */}
          <Svg width={700 * k} height={1500 * k} viewBox="-150 0 700 1500" style={{ position: 'absolute', left: -150 * k, top: 0 }} pointerEvents="none">
            {bands.map(([y, h], i) => (
              <Ellipse key={i} cx={-60 + ((i * 190 + layer * 110) % 560)} cy={y + layer * 14} rx={190} ry={h} fill={color} opacity={o} />
            ))}
          </Svg>
        </Loop>
      ))}
    </>
  );
}

// Slowly bobbing, pulsing points of light.
export function Fireflies({ k, area, n = 18, color = '#FFE98A', seed = 7 }: { k: number; area: [number, number, number, number]; n?: number; color?: string; seed?: number }) {
  const r = rng(seed);
  const [x0, y0, x1, y1] = area;
  const groups = [0, 1, 2].map((g) =>
    Array.from({ length: Math.ceil(n / 3) }, () => [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)] as const),
  );
  return (
    <>
      {groups.map((pts, g) => (
        <Loop key={g} dx={(g - 1) * 14 * k} dy={(g % 2 ? -1 : 1) * 12 * k} o0={0.15} o1={1} ms={5200 + g * 2300} delay={g * 900}>
          <Layer k={k}>
            {pts.map(([x, y], i) => (
              <Circle key={i} cx={x} cy={y} r={1.8} fill={color} />
            ))}
            {pts.map(([x, y], i) => (
              <Circle key={'h' + i} cx={x} cy={y} r={5} fill={color} opacity={0.22} />
            ))}
          </Layer>
        </Loop>
      ))}
    </>
  );
}

// Points rising and fading (embers, motes, sand grains).
export function Rising({ k, area, n = 20, color = '#FF8A3D', dy = -90, dx = 20, seed = 11, ms = 7000 }: { k: number; area: [number, number, number, number]; n?: number; color?: string; dy?: number; dx?: number; seed?: number; ms?: number }) {
  const r = rng(seed);
  const [x0, y0, x1, y1] = area;
  return (
    <>
      {[0, 1].map((g) => (
        <Loop key={g} dy={dy * k} dx={dx * k * (g ? -1 : 1)} o0={1} o1={0} ms={ms + g * 2600} delay={g * 1700} restart>
          <Layer k={k}>
            {Array.from({ length: Math.ceil(n / 2) }, (_, i) => {
              const x = x0 + r() * (x1 - x0);
              const y = y0 + r() * (y1 - y0);
              return (
                <G2 key={i}>
                  <Circle cx={x} cy={y} r={1.6 + r() * 1.2} fill={color} />
                  <Circle cx={x} cy={y} r={4.5} fill={color} opacity={0.2} />
                </G2>
              );
            })}
          </Layer>
        </Loop>
      ))}
    </>
  );
}
const G2 = ({ children }: { children: ReactNode }) => <>{children}</>;

// A small waterfall: soft body plus light streaks that slide down on a seamless loop.
export function Waterfall({ k, x, y, w, h, base = '#7FE8E0', foam = '#FFFFFF' }: { k: number; x: number; y: number; w: number; h: number; base?: string; foam?: string }) {
  const calm = useReducedMotion();
  const period = 22 * k;
  const v = useSharedValue(0);
  useEffect(() => {
    if (calm) return;
    v.value = 0;
    v.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1, false);
  }, [calm, v]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: v.value * period }] }));
  const rows = Math.ceil((h * k) / period) + 3;
  const cols = [0.18, 0.46, 0.74];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x * k, top: y * k, width: w * k, height: h * k, overflow: 'hidden', borderRadius: (w * k) / 3, backgroundColor: base + 'B8' }}>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: -period * 2, height: h * k + period * 3 }, anim]}>
        {Array.from({ length: rows }, (_, i) =>
          cols.map((c, j) => (
            <View key={`${i}-${j}`} style={{ position: 'absolute', top: i * period + (j % 2) * period * 0.4, left: c * w * k, width: Math.max(2, w * k * 0.1), height: period * 0.5, borderRadius: 3, backgroundColor: foam, opacity: 0.6 }} />
          )),
        )}
      </Animated.View>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.min(14 * k, h * k * 0.25), backgroundColor: foam, opacity: 0.45 }} />
    </View>
  );
}
