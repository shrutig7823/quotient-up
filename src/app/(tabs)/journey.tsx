import { usePathname, useRouter } from 'expo-router';
import { ChevronRight, Clock, Coins, KeyRound, Mountain, Shuffle, User, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { GENRES, PLAYABLE_GENRES } from '@/config/genres';
import { Ridge, Stars } from '@/scene/art';
import { useGame } from '@/state/gameStore';
import { MiniArt } from '@/ui/MiniArt';
import { ShuffleDeck } from '@/ui/ShuffleDeck';
import { Tooltip } from '@/ui/Tooltip';
import { C, R, TAB_BAR_HEIGHT, font } from '@/ui/theme';

const GOLD = '#FFC94D';
const INK = '#17163D';
const GAP = 12;
const MAX_W = 760;

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 12, borderRadius: R.pill, backgroundColor: 'rgba(12,16,40,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' }}>
      {children}
    </View>
  );
}

// One screen, no scrolling: header, small Summit, six branches. Sizes come from the space that is
// actually available (after the header, the bottom navigation and safe areas), not from fixed heights.
export default function Journey() {
  const router = useRouter();
  const calm = useReducedMotion();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const { masteredGenres, levelStars, attempts, xp, coins, shuffleTipSeen, markShuffleTipSeen } = useGame();
  // Space available to this screen: the window minus the bottom navigation (safe-area top is added below).
  const W = win.width;
  const H = win.height - TAB_BAR_HEIGHT;
  const mobile = W < 640;
  const cols = mobile ? 2 : 3;
  const rows = GENRES.length / cols;
  const pad = mobile ? 14 : 24;
  const contentW = Math.min(W, MAX_W) - pad * 2;
  const short = H < 600; // a short screen: shrink the header and Summit before the cards
  const headerH = short ? 46 : 52;
  const summitH = short ? 80 : mobile ? 100 : 112;
  const top = Math.max(insets.top, 8);
  const availH = H - top - headerH - summitH - pad - GAP * 2 - (rows - 1) * GAP - 8;
  const cellH = Math.max(108, Math.min(176, Math.floor(availH / rows)));
  const cellW = Math.floor((contentW - GAP * (cols - 1)) / cols);
  const compact = cellH < 140 || mobile;
  const tight = cellH < 132; // not enough height for the full card: smaller icon, no world line, slimmer button
  const narrow = W < 380; // no room for the logo mark beside the name

  const keys = masteredGenres.length;
  const doneFor = (slug: string) => Object.keys(levelStars).filter((s) => s.startsWith(slug + ':')).length;
  // The branch to point at: the one played last, otherwise the first.
  const lastGenre = attempts.length ? attempts[attempts.length - 1].levelKey.split(':')[0] : GENRES[0].slug;
  const current = GENRES.some((g) => g.slug === lastGenre) ? lastGenre : GENRES[0].slug;

  // "Can't decide?" The Shuffle button opens a table where the six cards come to the front, are shuffled
  // and dealt, and one is turned over at random. The pick stays highlighted on the home page afterwards.
  const [deckOpen, setDeckOpen] = useState(false);

  // One-line tooltip on the Shuffle button. It appears by itself, once, when someone has been on this
  // screen for a while without choosing anything (a sign they may be unsure), and whenever the button
  // is hovered or focused. Tapping the bubble, the button or a card dismisses it.
  const [tip, setTip] = useState(false);
  const [tipHeld, setTipHeld] = useState(false); // hover / keyboard focus on the button
  const dismissTip = () => {
    setTip(false);
    if (!shuffleTipSeen) markShuffleTipSeen();
  };
  const onHome = usePathname() === '/journey'; // the tab stays mounted while other screens are open, so check where we are
  useEffect(() => {
    if (shuffleTipSeen || deckOpen || !onHome) return;
    const t = setTimeout(() => setTip(true), 9000);
    return () => clearTimeout(t); // leaving the screen resets the wait
  }, [shuffleTipSeen, deckOpen, onHome]);
  useEffect(() => {
    if (!tip) return;
    const t = setTimeout(dismissTip, 8000); // never lingers
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tip]);
  const [pick, setPick] = useState<string | null>(null);
  const openWorld = (slug: string) => {
    setPick(null);
    setDeckOpen(false);
    router.push({ pathname: '/genre/[slug]', params: { slug } });
  };
  const highlight = pick ?? current;
  const deckCards = GENRES.filter((g) => PLAYABLE_GENRES.has(g.slug)).map((g) => ({
    slug: g.slug, short: g.short, world: g.world, color: g.color, done: doneFor(g.slug), total: g.levelCount,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#070D24' }}>
      {/* Background: midnight to forest, a faint mountain behind the Summit, soft gold glow, light texture */}
      <Svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0A1030" />
            <Stop offset="0.55" stopColor="#0B2236" />
            <Stop offset="1" stopColor="#0A2A24" />
          </LinearGradient>
          <RadialGradient id="gl" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFC94D" stopOpacity="0.28" />
            <Stop offset="1" stopColor="#FFC94D" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#bg)" />
        <Stars seed={9} n={46} w={W} h={H * 0.5} color="#CFE9FF" />
        <Rect x={W / 2 - 220} y={top + headerH - 40} width={440} height={260} fill="url(#gl)" />
        <Ridge y={top + headerH + 96} h={110} seed={5} fill="#17304F" peaks={4} opacity={0.55} w={W} />
        <Ridge y={top + headerH + 118} h={70} seed={11} fill="#10392F" peaks={6} opacity={0.6} w={W} />
      </Svg>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingTop: top, paddingBottom: pad }} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ width: contentW + pad * 2, paddingHorizontal: pad }}>
          {/* Compact header */}
          <View style={{ height: headerH, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
              {!narrow && <Mountain size={22} color={GOLD} strokeWidth={2.2} />}
              <Text numberOfLines={1} style={{ fontFamily: font.heavy, fontSize: narrow ? 19 : mobile ? 18 : 21, color: C.text, letterSpacing: -0.3, flexShrink: 1 }} accessibilityRole="header">Quotient Up</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pill><Zap size={15} color={GOLD} fill={GOLD} /><Text style={{ fontFamily: font.bold, fontSize: 14, color: C.text }}>{xp}</Text></Pill>
              <Pill><Coins size={15} color={GOLD} /><Text style={{ fontFamily: font.bold, fontSize: 14, color: C.text }}>{coins}</Text></Pill>
              <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="Profile"
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(12,16,40,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <User size={19} color={C.text} />
              </Pressable>
            </View>
          </View>

          {/* The Summit: small destination, top centre */}
          <View
            accessibilityLabel={`The Summit, the final challenge. ${keys} of 6 keys.`}
            style={{ height: summitH, alignItems: 'center', justifyContent: 'center', gap: 4, zIndex: 5 }}>
            {/* Shuffle: for people who cannot decide where to begin */}
            <Pressable
              onPress={() => { dismissTip(); setDeckOpen(true); }}
              onHoverIn={() => setTipHeld(true)}
              onHoverOut={() => setTipHeld(false)}
              onFocus={() => setTipHeld(true)}
              onBlur={() => setTipHeld(false)}
              accessibilityRole="button"
              accessibilityHint="Picks a random world for you when you cannot decide"
              accessibilityLabel="Not sure where to start? Shuffle the cards to get a random world"
              style={(st: any) => ({
                position: 'absolute', right: 0, top: Math.max(0, (summitH - 62) / 2), alignItems: 'center', gap: 3,
                transform: [{ scale: st.pressed && !calm ? 0.94 : 1 }], cursor: 'pointer', outlineStyle: 'none',
              } as any)}>
              {(st: any) => (
                <>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,201,77,0.16)', borderWidth: st?.focused ? 3 : 1.5, borderColor: st?.focused ? '#fff' : GOLD, alignItems: 'center', justifyContent: 'center' }}>
                    <Shuffle size={21} color={GOLD} strokeWidth={2.4} />
                  </View>
                  <Text style={{ fontFamily: font.bold, fontSize: 11, color: C.muted }}>{pick ? 'Again' : 'Shuffle'}</Text>
                </>
              )}
            </Pressable>
            <Tooltip
              visible={(tip || tipHeld) && !deckOpen}
              text="Can't decide? Shuffle picks a world for you."
              onDismiss={dismissTip}
              maxWidth={Math.min(250, contentW)}
              style={{ right: 0, top: Math.max(0, (summitH - 62) / 2) + 62 + 8 }}
            />
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,201,77,0.16)', borderWidth: 1, borderColor: 'rgba(255,201,77,0.55)', alignItems: 'center', justifyContent: 'center' }}>
              <Mountain size={26} color={GOLD} strokeWidth={2} />
            </View>
            <Text style={{ fontFamily: font.heavy, fontSize: 17, color: C.text }}>The Summit</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 3 }}>
                {Array.from({ length: 6 }, (_, i) => <KeyRound key={i} size={13} color={i < keys ? GOLD : '#7E86B8'} strokeWidth={2.2} />)}
              </View>
              <Text style={{ fontFamily: font.bold, fontSize: 13, color: C.muted }}>{keys}/6 keys</Text>
            </View>
          </View>

          {/* Six branches */}
          <View style={{ width: contentW, flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: GAP }}>
            <Text accessibilityLiveRegion="polite" style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}>
              {pick ? `Your pick is ${GENRES.find((g) => g.slug === pick)?.short}.` : ''}
            </Text>
            {GENRES.map((g) => {
              const active = PLAYABLE_GENRES.has(g.slug);
              const done = doneFor(g.slug);
              const isCurrent = active && g.slug === highlight;
              const mastered = masteredGenres.includes(g.slug);
              const label = active ? `${g.short}, ${done} of ${g.levelCount} levels complete. ${done > 0 ? 'Continue' : 'Start'}.` : `${g.short}, coming soon.`;
              const art = tight ? 36 : compact ? 46 : 60;
              const bar = (
                <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                  <View style={{ width: `${Math.round((done / g.levelCount) * 100)}%` as any, height: 5, backgroundColor: g.color }} />
                </View>
              );
              const body = (
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: art, height: art, borderRadius: 12, backgroundColor: `${g.color}22`, alignItems: 'center', justifyContent: 'center', opacity: active ? 1 : 0.7 }}>
                      <MiniArt slug={g.slug} size={art - 6} lit={isCurrent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontFamily: font.heavy, fontSize: tight ? 15 : compact ? 16 : 18, color: C.text }}>{g.short}</Text>
                      {!tight && <Text numberOfLines={1} style={{ fontFamily: font.medium, fontSize: 12, color: C.muted }}>{g.world}</Text>}
                    </View>
                    {mastered && <KeyRound size={16} color={GOLD} />}
                  </View>
                  <View style={{ gap: tight ? 5 : 6 }}>
                    {tight ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontFamily: font.bold, fontSize: 12, color: C.text }}>{done}/{g.levelCount}</Text>
                        {bar}
                      </View>
                    ) : (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontFamily: font.bold, fontSize: 13, color: C.text }}>{done}/{g.levelCount}</Text>
                          {!active && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} color={C.muted} />
                              <Text style={{ fontFamily: font.medium, fontSize: 12, color: C.muted }}>Coming soon</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row' }}>{bar}</View>
                      </>
                    )}
                    {active && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: tight ? 30 : 36, borderRadius: R.pill, backgroundColor: isCurrent ? GOLD : 'transparent', borderWidth: isCurrent ? 0 : 1.5, borderColor: isCurrent ? GOLD : 'rgba(255,255,255,0.28)' }}>
                        <Text style={{ fontFamily: font.heavy, fontSize: 14, color: isCurrent ? INK : C.text }}>{done > 0 ? 'Continue' : 'Start'}</Text>
                        <ChevronRight size={16} color={isCurrent ? INK : C.text} strokeWidth={2.6} />
                      </View>
                    )}
                  </View>
                </View>
              );
              const box = {
                width: cellW, height: cellH, borderRadius: 20, padding: tight ? 9 : 12, borderWidth: isCurrent ? 2 : 1,
                borderColor: isCurrent ? GOLD : 'rgba(255,255,255,0.14)', backgroundColor: isCurrent ? 'rgba(48,40,22,0.92)' : 'rgba(16,22,52,0.86)',
              } as const;
              const card = !active ? (
                <View accessibilityLabel={label} accessibilityState={{ disabled: true }} style={box}>{body}</View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={g.slug === pick ? `Your pick: ${label}` : label}
                  onPress={() => openWorld(g.slug)}
                  style={(st: any) => ({
                    ...box,
                    transform: [{ translateY: st.pressed && !calm ? 2 : st.hovered && !calm ? -2 : 0 }],
                    boxShadow: st.focused ? '0 0 0 3px #fff' : isCurrent ? '0 0 26px rgba(255,201,77,0.32)' : st.hovered ? '0 8px 20px rgba(0,0,0,0.4)' : '0 3px 8px rgba(0,0,0,0.3)',
                    cursor: 'pointer', outlineStyle: 'none',
                    transitionProperty: 'transform, box-shadow', transitionDuration: calm ? '0ms' : '150ms',
                  } as any)}>
                  {body}
                </Pressable>
              );
              return (
                <View key={g.slug} style={{ width: cellW, height: cellH }}>
                  {card}
                  {pick === g.slug && (
                    <View pointerEvents="none" style={{ position: 'absolute', top: -10, right: 12, paddingVertical: 3, paddingHorizontal: 10, borderRadius: R.pill, backgroundColor: GOLD }}>
                      <Text style={{ fontFamily: font.heavy, fontSize: 11, color: INK }}>Your pick!</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* The shuffle table: the six cards come to the front, get shuffled, and one is dealt at random. */}
      {deckOpen && (
        <ShuffleDeck cards={deckCards} onClose={() => setDeckOpen(false)} onPick={setPick} onStart={openWorld} />
      )}
    </View>
  );
}
