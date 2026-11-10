import { useRouter } from 'expo-router';
import { Brain, CheckCircle2, ChevronRight, Minus, RefreshCw, Sparkles, TrendingDown, TrendingUp, Zap } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GENRES, getGenre } from '@/config/genres';
import { buildPractice, conceptLabel, currentAttempts, entryFor, metaFor, practiceId } from '@/content/practice';
import { type ConceptMastery, computeMastery, genreMastery, genreOf, strongest, weakest } from '@/engine/mastery';
import { type Improvement, improvements, missedFamilies, recentTrend, rootOf } from '@/engine/progress';
import { overallAccuracy } from '@/engine/profile';
import { useGame } from '@/state/gameStore';
import { C, R, S, T, font } from '@/ui/theme';

const GOLD = '#FFC94D';
const INK = '#17163D';
const card = { backgroundColor: 'rgba(16,22,52,0.86)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: S.lg, gap: S.md } as const;

function TrendIcon({ t }: { t: ConceptMastery['trend'] }) {
  if (t === 'up') return <TrendingUp size={16} color={C.good} />;
  if (t === 'down') return <TrendingDown size={16} color="#F87171" />;
  if (t === 'flat') return <Minus size={16} color={C.muted} />;
  return null;
}

function SkillRow({ c, imp }: { c: ConceptMastery; imp?: Improvement }) {
  const g = getGenre(genreOf(c.concept));
  const speedText = c.speed === null ? null : c.speed <= 0.9 ? 'faster than expected' : c.speed >= 1.5 ? 'slower than expected' : 'about as expected';
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: font.bold, fontSize: 15, color: C.text }} numberOfLines={1}>{conceptLabel(c.concept)}</Text>
          <Text style={T.small}>{g?.short}{c.confidence === 'early' ? ' · early estimate' : ''}{speedText ? ` · ${speedText}` : ''}</Text>
        </View>
        {imp && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 3, paddingHorizontal: 8, borderRadius: R.pill, backgroundColor: 'rgba(34,197,94,0.16)' }}>
            <TrendingUp size={13} color={C.good} />
            <Text style={{ fontFamily: font.bold, fontSize: 12, color: C.good }}>+{imp.delta}</Text>
          </View>
        )}
        <TrendIcon t={c.trend} />
        <Text style={{ fontFamily: font.heavy, fontSize: 18, color: C.text, minWidth: 48, textAlign: 'right' }}>{c.mastery}%</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        <View style={{ width: `${c.mastery}%` as any, height: 6, backgroundColor: g?.color ?? GOLD }} />
      </View>
    </View>
  );
}

const Stat = ({ value, label }: { value: string; label: string }) => (
  <View style={{ flex: 1, minWidth: 120, alignItems: 'center', gap: 2, paddingVertical: S.md, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)' }}>
    <Text style={{ fontFamily: font.heavy, fontSize: 22, color: C.text }}>{value}</Text>
    <Text style={T.small}>{label}</Text>
  </View>
);

export default function Learn() {
  const router = useRouter();
  const allAttempts = useGame((s) => s.attempts);
  const attempts = useMemo(() => currentAttempts(allAttempts), [allAttempts]);
  const meta = useMemo(() => metaFor(attempts), [attempts]);
  const list = useMemo(() => computeMastery(attempts, meta), [attempts, meta]);
  const gains = useMemo(() => improvements(attempts, meta), [attempts, meta]);
  const gainBy = useMemo(() => Object.fromEntries(gains.map((x) => [x.concept, x])), [gains]);
  const fams = useMemo(() => missedFamilies(attempts), [attempts]);
  const open = fams.filter((f) => f.status === 'open');
  const recovered = fams.filter((f) => f.status === 'recovered');
  const trend = useMemo(() => recentTrend(attempts, 10), [attempts]);
  const accuracy = overallAccuracy(attempts);

  const weak = weakest(list, 3);
  const strong = strongest(list, 3);
  const needMore = list.filter((c) => c.mastery === null).length;
  const quick = weak[0];
  const quickSet = quick ? buildPractice(genreOf(quick.concept), quick.concept.split(':')[1], attempts) : undefined;
  const quickMin = quickSet ? Math.max(1, Math.ceil(quickSet.questions.reduce((t, q) => t + q.expectedSeconds, 0) / 60)) : 0;
  const retryRoute = (root: string) => ({ pathname: '/level/[id]' as const, params: { id: `${(entryFor(root)?.concept ?? 'quant:x').split(':')[0]}-retry-${root}` } });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#070D24' }} contentContainerStyle={{ alignItems: 'center', paddingTop: 54, paddingBottom: S.xxl }}>
      <View style={{ width: '100%', maxWidth: 640, paddingHorizontal: S.lg, gap: S.lg }}>
        <View style={{ gap: 4 }}>
          <Text style={T.h1} accessibilityRole="header">Learn</Text>
          <Text style={T.body}>Where you're strong, what to fix, and how you're improving. Everything here comes from your real answers.</Text>
        </View>

        {attempts.length === 0 ? (
          <View style={{ ...card, alignItems: 'center', paddingVertical: S.xxl }}>
            <Brain size={36} color={GOLD} />
            <Text style={T.card}>Nothing to show yet</Text>
            <Text style={[T.body, { textAlign: 'center' }]}>Play a few levels first. Your progress, strengths and the questions to retry will appear here.</Text>
            <Pressable onPress={() => router.push('/journey')} style={{ height: 44, paddingHorizontal: 22, borderRadius: R.pill, backgroundColor: GOLD, justifyContent: 'center', marginTop: S.sm }}>
              <Text style={{ fontFamily: font.heavy, fontSize: 15, color: INK }}>Go to the Journey</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Progress dashboard */}
            <View style={card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
                <Sparkles size={18} color={GOLD} />
                <Text style={T.card}>Your progress</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
                <Stat value={String(attempts.length)} label="Answered" />
                <Stat value={accuracy === null ? '-' : `${accuracy}%`} label="Accuracy" />
                <Stat value={String(recovered.length)} label="Mistakes recovered" />
                <Stat value={String(gains.length)} label="Skills improved" />
              </View>
              {trend && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {trend.delta > 0 ? <TrendingUp size={18} color={C.good} /> : trend.delta < 0 ? <TrendingDown size={18} color="#F87171" /> : <Minus size={18} color={C.muted} />}
                  <Text style={{ flex: 1, fontFamily: font.medium, fontSize: 14, color: C.text }}>
                    Your last 10 answers: {trend.recent}% right{trend.delta > 0 ? `, up ${trend.delta} points from the 10 before` : trend.delta < 0 ? `, down ${-trend.delta} points from the 10 before` : ', the same as the 10 before'}.
                  </Text>
                </View>
              )}
              {gains.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Text style={T.label}>You improved on</Text>
                  {gains.slice(0, 4).map((x) => (
                    <View key={x.concept} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TrendingUp size={16} color={C.good} />
                      <Text style={{ flex: 1, fontFamily: font.bold, fontSize: 14, color: C.text }} numberOfLines={1}>{conceptLabel(x.concept)}</Text>
                      <Text style={{ fontFamily: font.medium, fontSize: 13, color: C.muted }}>{x.from}% → </Text>
                      <Text style={{ fontFamily: font.heavy, fontSize: 14, color: C.good }}>{x.to}%</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={T.small}>Keep practising. When a skill gets stronger than when you started it, it shows up here.</Text>
              )}
            </View>

            {/* Try again: questions you missed, as fresh versions */}
            <View style={{ ...card, borderColor: open.length ? 'rgba(255,201,77,0.5)' : 'rgba(255,255,255,0.12)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
                <RefreshCw size={18} color={GOLD} />
                <Text style={T.card}>Try again</Text>
              </View>
              {open.length === 0 ? (
                <Text style={T.body}>
                  {recovered.length > 0 ? 'Nothing left to retry. You recovered every question you missed.' : 'No missed questions. If you get one wrong, you can try a fresh version of it here.'}
                </Text>
              ) : (
                <>
                  <Text style={T.body}>Questions you missed. Each button gives you a fresh version: the same kind of question with different numbers.</Text>
                  {open.slice(0, 5).map((f) => {
                    const e = entryFor(f.root);
                    if (!e) return null;
                    return (
                      <View key={f.root} style={{ gap: 8, paddingTop: S.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
                        <Text style={T.small}>{getGenre(e.genreId)?.short} · {e.primarySkill}{f.retries > 0 ? ` · ${f.retries} new version${f.retries > 1 ? 's' : ''} tried` : ''}</Text>
                        <Text style={{ fontFamily: font.medium, fontSize: 14, color: C.text }} numberOfLines={3}>{e.prompt}</Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Try a new version of the ${e.primarySkill} question you missed`}
                          onPress={() => router.push(retryRoute(f.root))}
                          style={(st: any) => ({ height: 44, borderRadius: R.pill, backgroundColor: GOLD, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: st.pressed ? 0.85 : 1, cursor: 'pointer' } as any)}>
                          <Text style={{ fontFamily: font.heavy, fontSize: 15, color: INK }}>Try a new version</Text>
                          <ChevronRight size={18} color={INK} strokeWidth={2.6} />
                        </Pressable>
                      </View>
                    );
                  })}
                </>
              )}
              {recovered.length > 0 && (
                <View style={{ gap: 6, paddingTop: S.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
                  <Text style={T.label}>Recovered</Text>
                  {recovered.slice(0, 4).map((f) => (
                    <View key={f.root} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} color={C.good} />
                      <Text style={{ flex: 1, fontFamily: font.medium, fontSize: 14, color: C.text }} numberOfLines={1}>{entryFor(f.root)?.primarySkill}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Quick Fix */}
            <View style={{ ...card, borderColor: quick ? 'rgba(255,201,77,0.6)' : 'rgba(255,255,255,0.12)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
                <Zap size={18} color={GOLD} fill={GOLD} />
                <Text style={[T.label, { color: GOLD }]}>Quick Fix</Text>
              </View>
              {quick && quickSet ? (
                <>
                  <Text style={[T.h2, { fontSize: 22 }]}>{conceptLabel(quick.concept)}</Text>
                  <Text style={T.body}>
                    Your mastery here is {quick.mastery}%{quick.confidence === 'early' ? ' (an early estimate)' : ''}. {quickSet.questions.length} questions · about {quickMin} min.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/level/[id]', params: { id: practiceId(quick.concept) } })}
                    style={(st: any) => ({ height: 48, borderRadius: R.pill, backgroundColor: GOLD, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: st.pressed ? 0.85 : 1, cursor: 'pointer' } as any)}>
                    <Text style={{ fontFamily: font.heavy, fontSize: 16, color: INK }}>Practise now</Text>
                    <ChevronRight size={18} color={INK} strokeWidth={2.6} />
                  </Pressable>
                </>
              ) : list.some((c) => c.mastery !== null) ? (
                <Text style={T.body}>No skill is below 75% right now. Nice. Keep climbing to find new challenges.</Text>
              ) : (
                <Text style={T.body}>Answer a few more questions. A skill needs at least 2 different questions before we can estimate it.</Text>
              )}
            </View>

            {/* By world */}
            <View style={card}>
              <Text style={T.card}>Mastery by world</Text>
              {GENRES.map((g) => {
                const m = genreMastery(list, g.slug);
                return (
                  <View key={g.slug} style={{ gap: 5 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontFamily: font.bold, fontSize: 14, color: C.text }}>{g.short}</Text>
                      <Text style={{ fontFamily: font.bold, fontSize: 14, color: m === null ? C.faint : C.text }}>{m === null ? 'No data yet' : `${m}%`}</Text>
                    </View>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                      <View style={{ width: `${m ?? 0}%` as any, height: 6, backgroundColor: g.color }} />
                    </View>
                  </View>
                );
              })}
            </View>

            {weak.length > 0 && (
              <View style={card}>
                <Text style={T.card}>Needs work</Text>
                {weak.map((c) => <SkillRow key={c.concept} c={c} imp={gainBy[c.concept]} />)}
              </View>
            )}
            {strong.length > 0 && (
              <View style={card}>
                <Text style={T.card}>Strongest</Text>
                {strong.map((c) => <SkillRow key={c.concept} c={c} imp={gainBy[c.concept]} />)}
              </View>
            )}
            {needMore > 0 && (
              <Text style={[T.small, { textAlign: 'center' }]}>
                {needMore} skill{needMore > 1 ? 's' : ''} need{needMore > 1 ? '' : 's'} answers from at least 2 different questions before we can estimate {needMore > 1 ? 'them' : 'it'}.
              </Text>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
