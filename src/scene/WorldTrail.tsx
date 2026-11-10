import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock, Lock, MapPin, Star } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { PLAYABLE_GENRES, getGenre } from '@/config/genres';
import { levelsFor } from '@/content';
import { isLevelUnlocked, useGame } from '@/state/gameStore';
import { C, R, font } from '@/ui/theme';

import { Glow } from './art';
import { Layer, Loop } from './fx';
import { LANDMARKS } from './landmarks';
import { SCENE_H, SCENE_W } from './size';
import { Trail, buildTrail, nearestSample } from './trail';
import { getWorld } from './worlds';

const MAX_W = 640;
const NODE = 56;
const GOLD = '#FFC94D';
const INK = '#17163D';

// One category's world: scenery, a winding trail of level stops, and the Mastery Trial landmark at the end.
export function WorldTrail({ slug }: { slug: string }) {
  const router = useRouter();
  const calm = useReducedMotion();
  const { width: winW } = useWindowDimensions();
  const sceneW = Math.min(winW, MAX_W);
  const k = sceneW / SCENE_W;
  const world = getWorld(slug);
  const genre = getGenre(slug);
  const levelStars = useGame((s) => s.levelStars);
  const scroller = useRef<any>(null);
  const [vh, setVh] = useState(0);
  const placed = useRef(false);

  const built = useMemo(() => (world ? buildTrail(world.route, world.amp, 12) : null), [world]);
  const levels = levelsFor(slug);
  const playable = PLAYABLE_GENRES.has(slug);

  const count = genre?.levelCount ?? 10;
  const starsOf = (n: number) => levelStars[`${slug}:${n}`] ?? 0;
  const done = Array.from({ length: count }, (_, i) => starsOf(i + 1)).filter((s) => s > 0).length;
  const currentN = playable
    ? Array.from({ length: count }, (_, i) => i + 1).find((n) => isLevelUnlocked(levelStars, slug, n) && starsOf(n) === 0) ?? null
    : null;

  // Coming back from a level you just cleared: the marker travels from that level to the next one.
  const params = useLocalSearchParams<{ advance?: string }>();
  const advance = Number(params.advance) || 0;
  const canMove = !!world && playable && advance >= 1 && advance < count && starsOf(advance) > 0;
  const [moving, setMoving] = useState(canMove && !calm);
  const progress = useSharedValue(0);

  // Points along the trail between the two level stops.
  const hop = useMemo(() => {
    if (!world || !built || !canMove) return null;
    const a = nearestSample(built.samples, world.route[advance - 1][0], world.route[advance - 1][1]);
    const b = nearestSample(built.samples, world.route[advance][0], world.route[advance][1]);
    const pts = built.samples.slice(Math.min(a, b), Math.max(a, b) + 1);
    return pts.length > 1 ? pts : null;
  }, [world, built, canMove, advance]);

  useEffect(() => {
    if (!moving || !hop) return;
    const duration = 1900;
    progress.value = 0;
    progress.value = withDelay(600, withTiming(hop.length - 1, { duration, easing: Easing.inOut(Easing.cubic) }));
    const t = setTimeout(() => setMoving(false), 600 + duration + 150);
    return () => clearTimeout(t);
  }, [moving, hop, progress]);

  const travelStyle = useAnimatedStyle(() => {
    if (!hop) return {};
    const idx = hop.map((_, i) => i);
    return {
      transform: [
        { translateX: interpolate(progress.value, idx, hop.map((p) => p.x * k)) },
        { translateY: interpolate(progress.value, idx, hop.map((p) => p.y * k)) },
      ],
    };
  });

  useEffect(() => {
    if (!vh || placed.current || !world) return;
    placed.current = true;
    const y = moving && canMove
      ? (world.route[advance - 1][1] + world.route[advance][1]) / 2
      : world.route[Math.min(currentN ?? 1, count) - 1][1];
    scroller.current?.scrollTo({ y: Math.max(0, y * k - vh * 0.6), animated: false });
  }, [vh, world, currentN, k, count, moving, canMove, advance]);

  if (!world || !genre || !built) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <Text style={{ color: C.text, fontFamily: font.bold }}>This world isn't available.</Text>
        <Pressable onPress={() => router.replace('/journey')} style={{ padding: 16 }}><Text style={{ color: GOLD, fontFamily: font.bold }}>Back</Text></Pressable>
      </View>
    );
  }

  const bridgeSpans: [number, number][] = world.bridges.map(([a, b]) => {
    const sa = nearestSample(built.samples, world.route[a][0], world.route[a][1]);
    const sb = nearestSample(built.samples, world.route[b][0], world.route[b][1]);
    return [Math.min(sa, sb) + 3, Math.max(sa, sb) - 3];
  });
  const litIdx = (() => {
    let top = 0;
    for (let n = count; n >= 1; n--) if (starsOf(n) > 0) { top = n; break; }
    return top ? nearestSample(built.samples, world.route[top - 1][0], world.route[top - 1][1]) : 0;
  })();
  const trial = world.route[10];
  const props = { k, samples: built.samples, route: world.route };
  const TrialArt = LANDMARKS[slug];

  const shapeStyle = (state: 'done' | 'current' | 'open' | 'locked') => {
    const base = { width: NODE, height: NODE, alignItems: 'center', justifyContent: 'center', borderWidth: 3 } as any;
    const sh = world.node.shape;
    if (sh === 'circle') base.borderRadius = NODE / 2;
    else if (sh === 'square') base.borderRadius = 14;
    else if (sh === 'octagon') base.borderRadius = 20;
    else {
      base.borderRadius = 10;
      base.width = NODE - 10;
      base.height = NODE - 10;
      base.transform = [{ rotate: '45deg' }];
    }
    base.backgroundColor = state === 'locked' ? '#363A55' : world.node.fill;
    base.borderColor = state === 'current' ? GOLD : state === 'done' ? GOLD : state === 'locked' ? '#50557A' : world.node.rim;
    base.opacity = state === 'locked' ? 0.85 : 1;
    return base;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#070B24' }}>
      <ScrollView ref={scroller} onLayout={(e) => setVh(e.nativeEvent.layout.height)} contentContainerStyle={{ alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: sceneW, height: SCENE_H * k, overflow: 'hidden', backgroundColor: '#070B24' }}>
          {world.Far(props)}
          {world.Mid(props)}
          <Layer k={k}>
            <Trail built={built} style={world.trail} litTo={litIdx} bridges={bridgeSpans} />
          </Layer>
          <Layer k={k}>
            <Glow cx={trial[0]} cy={trial[1] - 70} r={120} color={GOLD} o={0.5} />
            <TrialArt x={trial[0]} y={trial[1] + 14} s={1.7} />
          </Layer>
          {world.Fore(props)}

          {/* Mastery Trial label */}
          <View style={{ position: 'absolute', left: trial[0] * k - 80, top: (trial[1] + 34) * k, width: 160, alignItems: 'center' }} pointerEvents="none">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 12, borderRadius: R.pill, backgroundColor: 'rgba(14,14,44,0.88)', borderWidth: 1, borderColor: 'rgba(255,201,77,0.6)' }}>
              <Lock size={12} color={GOLD} />
              <Text style={{ fontFamily: font.heavy, fontSize: 13, color: C.text }}>Mastery Trial</Text>
              <Clock size={11} color={C.muted} />
            </View>
          </View>

          {/* Level stops */}
          {Array.from({ length: count }, (_, i) => {
            const n = i + 1;
            const [x, y] = world.route[i];
            const stars = starsOf(n);
            const unlocked = playable && isLevelUnlocked(levelStars, slug, n);
            const state = stars > 0 ? 'done' : n === currentN ? 'current' : unlocked ? 'open' : 'locked';
            const title = levels.find((l) => l.n === n)?.title;
            const label = state === 'locked' ? `Level ${n}, ${playable ? 'locked' : 'coming soon'}` : `Level ${n}${title ? ', ' + title : ''}${stars ? `, ${stars} stars` : ''}`;
            const wrap = { position: 'absolute', left: x * k - 40, top: y * k - 40, width: 80, height: 80, alignItems: 'center', justifyContent: 'center' } as const;
            const inner = (
              <View style={shapeStyle(state)}>
                <View style={world.node.shape === 'diamond' ? { transform: [{ rotate: '-45deg' }] } : undefined}>
                  {state === 'locked' && playable ? (
                    <Lock size={18} color="#9094B8" />
                  ) : (
                    <Text style={{ fontFamily: font.heavy, fontSize: 20, color: state === 'locked' ? '#9094B8' : world.node.text }}>{n}</Text>
                  )}
                </View>
              </View>
            );
            return (
              <View key={n} style={wrap} pointerEvents="box-none">
                {state === 'current' && (
                  <Loop fill={false} o0={0.15} o1={0.8} ms={1400} style={{ position: 'absolute', width: 78, height: 78, borderRadius: 39, borderWidth: 3, borderColor: GOLD }}>
                    <View />
                  </Loop>
                )}
                {state === 'locked' || !unlocked ? (
                  <View accessibilityLabel={label} accessibilityState={{ disabled: true }}>{inner}</View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    onPress={() => router.push({ pathname: '/level/[id]', params: { id: `${slug}-${n}` } })}
                    style={(st: any) => ({
                      transform: [{ scale: st.pressed && !calm ? 0.94 : st.hovered && !calm ? 1.08 : 1 }],
                      boxShadow: st.focused ? '0 0 0 3px #fff' : state === 'current' ? '0 0 26px rgba(255,201,77,0.7)' : '0 4px 10px rgba(0,0,0,0.4)',
                      borderRadius: 30, cursor: 'pointer', outlineStyle: 'none',
                      transitionProperty: 'transform, box-shadow', transitionDuration: calm ? '0ms' : '160ms',
                    } as any)}>
                    {inner}
                  </Pressable>
                )}
                {stars > 0 && (
                  <View style={{ position: 'absolute', bottom: -2, flexDirection: 'row', gap: 1 }} pointerEvents="none">
                    {[1, 2, 3].map((s) => <Star key={s} size={13} color={GOLD} fill={s <= stars ? GOLD : 'transparent'} strokeWidth={2} />)}
                  </View>
                )}
                {state === 'current' && (
                  <>
                    {!moving && (
                      <View style={{ position: 'absolute', top: -34 }} pointerEvents="none">
                        <Loop fill={false} dy={calm ? 0 : 5} ms={1400}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={16} color={INK} strokeWidth={2.4} />
                          </View>
                        </Loop>
                      </View>
                    )}
                    <View style={{ position: 'absolute', top: 62, width: 230, alignItems: 'center' }} pointerEvents="none">
                      <View style={{ maxWidth: 230, paddingVertical: 3, paddingHorizontal: 11, borderRadius: R.pill, backgroundColor: GOLD }}>
                        <Text numberOfLines={1} style={{ fontFamily: font.heavy, fontSize: 13, color: INK }}>{title ? `${n}. ${title}` : `Level ${n}`}</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            );
          })}

          {/* The player's marker travelling from the level just cleared to the next one */}
          {moving && hop && (
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: -15, top: -50, width: 30, height: 46, alignItems: 'center' }, travelStyle]}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,201,77,0.9)' } as any}>
                <MapPin size={17} color={INK} strokeWidth={2.4} />
              </View>
              <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: GOLD }} />
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Compact top overlay: back, world, progress */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 10 }}>
        <View pointerEvents="box-none" style={{ width: sceneW, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.replace('/journey')} accessibilityRole="button" accessibilityLabel="Back to the mountain" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(12,12,40,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={24} color={C.text} />
          </Pressable>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: R.pill, backgroundColor: 'rgba(12,12,40,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
              <Text style={{ fontFamily: font.heavy, fontSize: 14, color: C.text }}>
                {genre.short} <Text style={{ fontFamily: font.medium, color: C.muted }}>· {world.env}</Text>
              </Text>
            </View>
            <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: R.pill, backgroundColor: 'rgba(12,12,40,0.78)' }}>
              <Text style={{ fontFamily: font.bold, fontSize: 12, color: playable ? GOLD : C.muted }}>
                {playable ? `${done}/${count} levels` : 'Levels coming soon'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
