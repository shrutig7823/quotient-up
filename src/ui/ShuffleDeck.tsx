import { ChevronRight, HelpCircle, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, R, TAB_BAR_HEIGHT, font } from '@/ui/theme';
import { MiniArt } from './MiniArt';

const GOLD = '#FFC94D';
const INK = '#17163D';
const GAP = 12;

export type DeckCardInfo = { slug: string; short: string; world: string; color: string; done: number; total: number };
type Phase = 'gather' | 'shuffle' | 'deal' | 'reveal';
type Target = { x: number; y: number; rot: number; scale: number; opacity: number; ms: number; down: boolean; z: number };

// One card on the table. Moving it slides, turns and zooms it; flipping shows its back or its face.
function DeckCard({ t, w, h, info, calm }: { t: Target; w: number; h: number; info: DeckCardInfo; calm: boolean }) {
  const x = useSharedValue(t.x);
  const y = useSharedValue(t.y);
  const rot = useSharedValue(t.rot);
  const scale = useSharedValue(calm ? t.scale : 0.25); // starts small, so opening the table zooms the cards in
  const opacity = useSharedValue(calm ? t.opacity : 0);
  const flip = useSharedValue(1);
  const [showBack, setShowBack] = useState(t.down);
  const first = useRef(true);

  useEffect(() => {
    const cfg = { duration: t.ms, easing: Easing.out(Easing.cubic) };
    if (calm) {
      x.value = t.x; y.value = t.y; rot.value = t.rot; scale.value = t.scale; opacity.value = t.opacity;
    } else {
      x.value = withTiming(t.x, cfg); y.value = withTiming(t.y, cfg); rot.value = withTiming(t.rot, cfg);
      scale.value = withTiming(t.scale, cfg); opacity.value = withTiming(t.opacity, cfg);
    }
  }, [t.x, t.y, t.rot, t.scale, t.opacity, t.ms, calm, x, y, rot, scale, opacity]);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (calm) { setShowBack(t.down); return; }
    flip.value = withSequence(withTiming(0, { duration: 130 }), withTiming(1, { duration: 130 }));
    const id = setTimeout(() => setShowBack(t.down), 130); // swap faces while the card is edge-on
    return () => clearTimeout(id);
  }, [t.down, calm, flip]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${rot.value}deg` }, { scale: scale.value }, { scaleX: flip.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h, zIndex: t.z }, style]}>
      {showBack ? (
        <View style={{ flex: 1, borderRadius: 18, backgroundColor: '#1B1650', borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(0,0,0,0.5)' } as any}>
          <View style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 1.5, borderColor: 'rgba(255,201,77,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <HelpCircle size={30} color={GOLD} strokeWidth={2.2} />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, borderRadius: 18, padding: 10, backgroundColor: '#161C48', borderWidth: 2, borderColor: info.color, justifyContent: 'space-between', boxShadow: '0 8px 18px rgba(0,0,0,0.5)' } as any}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: Math.min(60, h * 0.36), height: Math.min(60, h * 0.36), borderRadius: 14, backgroundColor: `${info.color}26`, alignItems: 'center', justifyContent: 'center' }}>
              <MiniArt slug={info.slug} size={Math.min(54, h * 0.32)} lit />
            </View>
            <Text numberOfLines={1} style={{ fontFamily: font.heavy, fontSize: 16, color: C.text }}>{info.short}</Text>
            <Text numberOfLines={1} style={{ fontFamily: font.medium, fontSize: 11, color: C.muted }}>{info.world}</Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: font.bold, fontSize: 12, color: C.text, textAlign: 'center' }}>{info.done}/{info.total}</Text>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
              <View style={{ width: `${Math.round((info.done / info.total) * 100)}%` as any, height: 5, backgroundColor: info.color }} />
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// "Can't decide?" The six cards come to the front of the screen, flip face-down, are shuffled,
// dealt back out, and one is turned over at random as the starting world.
export function ShuffleDeck({
  cards, onClose, onPick, onStart,
}: { cards: DeckCardInfo[]; onClose: () => void; onPick: (slug: string) => void; onStart: (slug: string) => void }) {
  const calm = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width: winW, height: fullH } = useWindowDimensions();
  const winH = fullH - TAB_BAR_HEIGHT; // the table covers the screen above the bottom navigation

  const n = cards.length;
  const stageW = Math.min(winW - 32, 560);
  const cols = stageW < 440 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const cardW = Math.min(150, Math.floor((stageW - GAP * (cols - 1)) / cols));
  const shortScreen = winH < 620;
  const titleH = shortScreen ? 60 : 76;
  const actionsH = shortScreen ? 124 : 142;
  const availH = winH - insets.top - 10 - titleH - actionsH - 20;
  const cardH = Math.max(96, Math.min(Math.round(cardW * 1.22), Math.floor((availH - GAP * (rows - 1)) / rows)));
  const stageH = rows * cardH + (rows - 1) * GAP;
  const gridW = cols * cardW + (cols - 1) * GAP;
  const grid = (i: number) => ({ x: (i % cols) * (cardW + GAP) + (stageW - gridW) / 2, y: Math.floor(i / cols) * (cardH + GAP) });
  const centre = { x: (stageW - cardW) / 2, y: (stageH - cardH) / 2 };

  const [phase, setPhase] = useState<Phase>('gather');
  const [winner, setWinner] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const [targets, setTargets] = useState<Target[]>(() => cards.map((_, i) => ({ ...grid(i), rot: 0, scale: 1, opacity: 1, ms: 450, down: false, z: i })));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const faceUp = useMemo(() => cards.map((_, i) => ({ ...grid(i), rot: 0, scale: 1, opacity: 1, ms: 450, down: false, z: i })), [cards, cols, cardW, cardH, stageW]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearAll();
    const pick = cards[Math.floor(Math.random() * n)].slug;
    setWinner(pick);
    setPhase('gather');
    const reveal = () => {
      setPhase('reveal');
      onPick(pick);
      setTargets(cards.map((c, i) => c.slug === pick
        ? { ...centre, rot: 0, scale: 1.18, opacity: 1, ms: 520, down: false, z: 99 }
        : { ...grid(i), rot: 0, scale: 0.92, opacity: 0.45, ms: 520, down: true, z: i }));
    };
    if (calm) { reveal(); return clearAll; }

    setTargets(faceUp); // 1. cards come to the front, face up
    later(() => setTargets(cards.map((_, i) => ({ ...grid(i), rot: 0, scale: 1, opacity: 1, ms: 300, down: true, z: i }))), 900); // 2. turn face-down
    later(() => { // 3. gather into a stack
      setPhase('shuffle');
      setTargets(cards.map((_, i) => ({ ...centre, x: centre.x + (i - n / 2) * 2, y: centre.y + (i - n / 2) * 2, rot: (i - 2.5) * 3, scale: 0.9, opacity: 1, ms: 380, down: true, z: i })));
    }, 1400);
    const steps = 9; // 4. shuffle: cards fly around the table and back
    for (let s = 0; s < steps; s++) {
      later(() => setTargets(cards.map((_, i) => {
        const a = Math.random() * Math.PI * 2;
        const rad = Math.min(stageW, stageH) * (0.18 + Math.random() * 0.3);
        return { x: centre.x + Math.cos(a) * rad, y: centre.y + Math.sin(a) * rad * 0.9, rot: (Math.random() - 0.5) * 70, scale: 0.9, opacity: 1, ms: 230, down: true, z: Math.floor(Math.random() * n) + i };
      })), 1900 + s * 250);
    }
    later(() => { setPhase('deal'); setTargets(cards.map((_, i) => ({ ...grid(i), rot: 0, scale: 1, opacity: 1, ms: 520, down: true, z: i }))); }, 1900 + steps * 250 + 100); // 5. deal back out
    later(reveal, 1900 + steps * 250 + 1000); // 6. turn one over
    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  const picked = cards.find((c) => c.slug === winner);
  const msg = phase === 'gather' ? "Can't decide? We'll pick for you." : phase === 'shuffle' ? 'Shuffling…' : phase === 'deal' ? 'Here we go…' : 'Your starting world';

  return (
    <View accessibilityViewIsModal style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(4,7,24,0.99)', alignItems: 'center', paddingTop: insets.top + 10 }}>
      <View style={{ width: stageW, height: titleH, justifyContent: 'center' }}>
        <Text accessibilityLiveRegion="polite" accessibilityRole="header" style={{ fontFamily: font.heavy, fontSize: 22, color: C.text, textAlign: 'center', paddingHorizontal: 52 }}>{msg}</Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close shuffle"
          style={{ position: 'absolute', right: 0, top: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <X size={22} color={C.text} />
        </Pressable>
      </View>

      <View style={{ width: stageW, height: stageH, marginTop: 4 }}>
        {cards.map((c, i) => <DeckCard key={c.slug} t={targets[i]} w={cardW} h={cardH} info={c} calm={calm} />)}
      </View>

      <View style={{ width: stageW, height: actionsH, justifyContent: 'center', gap: 10, paddingTop: 12 }}>
        {phase === 'reveal' && picked ? (
          <>
            <Text style={{ fontFamily: font.bold, fontSize: 14, color: C.muted, textAlign: 'center' }}>
              {picked.short} · {picked.world}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${picked.done > 0 ? 'Continue' : 'Start'} ${picked.short}`}
              onPress={() => onStart(picked.slug)}
              style={(st: any) => ({ height: 54, borderRadius: R.pill, backgroundColor: GOLD, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: st.pressed ? 0.88 : 1, cursor: 'pointer', outlineStyle: 'none', boxShadow: st.focused ? '0 0 0 3px #fff' : '0 0 24px rgba(255,201,77,0.35)' } as any)}>
              <Text style={{ fontFamily: font.heavy, fontSize: 17, color: INK }}>{picked.done > 0 ? 'Continue' : 'Start'} {picked.short}</Text>
              <ChevronRight size={20} color={INK} strokeWidth={2.6} />
            </Pressable>
            <Pressable onPress={() => setRun((r) => r + 1)} accessibilityRole="button" accessibilityLabel="Shuffle again" style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: font.bold, fontSize: 15, color: C.text }}>Shuffle again</Text>
            </Pressable>
          </>
        ) : (
          <Text style={{ fontFamily: font.medium, fontSize: 14, color: C.muted, textAlign: 'center' }}>One of these six worlds will be chosen at random.</Text>
        )}
      </View>
    </View>
  );
}
