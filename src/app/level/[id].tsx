import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SIGNUP_PROMPT_AFTER_LEVELS } from '@/config/economy';
import { getGenre } from '@/config/genres';
import { getLevel } from '@/content';
import { buildPractice, buildRetry } from '@/content/practice';
import { computeStars, rewardFor, type Reward } from '@/engine/scoring';
import { QuestionRenderer } from '@/questions/QuestionRenderer';
import type { Answer } from '@/questions/types';
import { correctAnswerOf, validate } from '@/questions/validate';
import { WorldBackdrop } from '@/scene/WorldBackdrop';
import { clearedLevelCount, isLevelUnlocked, useGame } from '@/state/gameStore';
import { C, R } from '@/ui/theme';

type Phase = 'intro' | 'play' | 'result';
type Result = { stars: number; correct: number; total: number; seconds: number; granted: Reward; showSignup: boolean; firstClear: boolean };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// One screen, three phases: intro -> questions (answer, check, feedback) -> result.
export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // The scenery changes per world; the question UI on top stays the same.
  return (
    <WorldBackdrop slug={String(id).split('-')[0]}>
      <LevelInner />
    </WorldBackdrop>
  );
}

function LevelInner() {
  const { id, r } = useLocalSearchParams<{ id: string; r?: string }>();
  const router = useRouter();
  const game = useGame();
  // "quant-practice-percentages" is a Quick Fix set, "quant-retry-QUA-014" is a fresh version of a missed
  // question; anything else is a journey level. Built once per open (`r` forces a new version), so the
  // questions do not reshuffle as answers are logged.
  const retry = String(id).includes('-retry-');
  const level = useMemo(() => {
    const t = String(id).match(/^([a-z]+)-retry-(.+)$/);
    if (t) return buildRetry(t[2], useGame.getState().attempts);
    const p = String(id).match(/^([a-z]+)-practice-(.+)$/);
    return p ? buildPractice(p[1], p[2], useGame.getState().attempts) : getLevel(id);
  }, [id, r]);
  const practice = level?.n === 0;

  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const runStart = useRef(0);
  const questionStart = useRef(0);
  const submitting = useRef(false); // guards against double-taps on Check

  if (!level) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 30 }}>
        <Text style={{ color: C.text, fontSize: 18, textAlign: 'center' }}>This level isn't available yet.</Text>
        <Pressable onPress={() => router.replace('/journey')} style={{ padding: 20 }}>
          <Text style={{ color: C.gold, textAlign: 'center', fontWeight: '800' }}>Back to the map</Text>
        </Pressable>
      </View>
    );
  }

  const genre = getGenre(level.genre)!;
  const key = `${level.genre}:${level.n}`;
  const unlocked = practice || isLevelUnlocked(game.levelStars, level.genre, level.n);
  const q = level.questions[index];
  const nextExists = !practice && !!getLevel(`${level.genre}-${level.n + 1}`);
  const expectedTotal = level.questions.reduce((t, x) => t + x.expectedSeconds, 0);

  const start = () => {
    setIndex(0);
    setAnswer(null);
    setChecked(false);
    setCorrectCount(0);
    setResult(null);
    runStart.current = Date.now();
    questionStart.current = Date.now();
    setPhase('play');
  };

  const check = () => {
    if (answer === null || answer === '' || checked || submitting.current) return;
    submitting.current = true;
    const ok = validate(q, answer);
    game.logAttempt({ questionId: q.id, concept: q.concept, levelKey: key, correct: ok, ms: Date.now() - questionStart.current, at: Date.now() });
    if (ok) setCorrectCount((c) => c + 1);
    setChecked(true);
    submitting.current = false;
  };

  const next = () => {
    if (index + 1 < level.questions.length) {
      setIndex(index + 1);
      setAnswer(null);
      setChecked(false);
      questionStart.current = Date.now();
      return;
    }
    const seconds = Math.round((Date.now() - runStart.current) / 1000);
    const total = level.questions.length;
    const stars = computeStars(correctCount, total, seconds, expectedTotal);
    // True only the first time this level earns a star: that is when the marker moves on the trail.
    const firstClear = !practice && stars > 0 && (useGame.getState().levelStars[key] ?? 0) === 0;
    // Practice sets pay nothing and never touch journey progress; their answers still feed mastery.
    const granted = practice ? { xp: 0, coins: 0 } : game.completeLevel(key, stars, rewardFor(correctCount, stars));
    const cleared = clearedLevelCount(useGame.getState().levelStars);
    const showSignup = !practice && stars > 0 && cleared >= SIGNUP_PROMPT_AFTER_LEVELS && !useGame.getState().signupPromptSeen;
    if (showSignup) game.markSignupPromptSeen();
    setResult({ stars, correct: correctCount, total, seconds, granted, showSignup, firstClear });
    setPhase('result');
  };

  const Button = ({ label, onPress, disabled, secondary }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) => (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        padding: 17, borderRadius: R.md, opacity: disabled ? 0.4 : 1,
        backgroundColor: secondary ? C.card : C.gold, borderWidth: secondary ? 1 : 0, borderColor: C.line,
      }}>
      <Text style={{ textAlign: 'center', fontSize: 17, fontWeight: '800', color: secondary ? C.text : '#1F2937' }}>{label}</Text>
    </Pressable>
  );

  const shell = { padding: 22, paddingTop: 56, gap: 16, maxWidth: 520, width: '100%' as const, alignSelf: 'center' as const, flexGrow: 1 };

  if (phase === 'intro') {
    return (
      <ScrollView contentContainerStyle={{ ...shell, justifyContent: 'center' }}>
        <Text style={{ fontSize: 56, textAlign: 'center' }}>{genre.emoji}</Text>
        <Text style={{ color: C.muted, textAlign: 'center', fontWeight: '700' }}>
          {retry ? `${genre.short} · try again` : practice ? `${genre.short} · practice` : `${genre.short} · Level ${level.n} of 20 · ${level.stage}`}
        </Text>
        <Text style={{ color: C.text, fontSize: 30, fontWeight: '900', textAlign: 'center' }}>{level.title}</Text>
        <Text style={{ color: C.muted, textAlign: 'center' }}>
          {level.questions.length} questions · about {Math.max(1, Math.round(expectedTotal / 60))} min{'\n'}
          {retry ? 'A fresh version of a question you missed: same kind, new numbers. It counts toward your mastery.' : practice ? 'Practice earns no stars or rewards, but it counts toward your mastery.' : '★ half right  ★★ 75% right  ★★★ all right, fast'}
        </Text>
        {unlocked ? (
          <Button label="Start" onPress={start} />
        ) : (
          <Text style={{ color: C.gold, textAlign: 'center', fontWeight: '700' }}>🔒 Earn a star on the previous level first.</Text>
        )}
        <Button label="Back" secondary onPress={() => router.replace(practice ? '/learn' : `/genre/${level.genre}`)} />
      </ScrollView>
    );
  }

  if (phase === 'result' && result) {
    const passed = result.stars > 0;
    return (
      <ScrollView contentContainerStyle={{ ...shell, justifyContent: 'center' }}>
        {!practice && (
          <Text style={{ fontSize: 54, textAlign: 'center', color: C.gold }}>
            {'★'.repeat(result.stars) + '☆'.repeat(3 - result.stars)}
          </Text>
        )}
        <Text style={{ color: C.text, fontSize: 28, fontWeight: '900', textAlign: 'center' }}>
          {retry ? (result.correct > 0 ? "You've got it now!" : 'Not yet') : practice ? 'Practice done' : passed ? 'Level cleared!' : 'Not quite'}
        </Text>
        <View style={{ backgroundColor: C.card, borderRadius: R.md, padding: 18, gap: 6 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{result.correct}/{result.total} correct</Text>
          <Text style={{ color: C.muted }}>Accuracy: {Math.round((result.correct / result.total) * 100)}%</Text>
          <Text style={{ color: C.muted }}>Time: {fmt(result.seconds)}</Text>
          {!practice && <Text style={{ color: C.gold, fontWeight: '800', marginTop: 6 }}>+{result.granted.xp} XP   +{result.granted.coins} coins</Text>}
          {!practice && result.granted.xp === 0 && <Text style={{ color: C.muted, fontSize: 12 }}>Replays only pay when you beat your best.</Text>}
          {practice && <Text style={{ color: C.muted, fontSize: 12 }}>{retry ? (result.correct > 0 ? 'That mistake is recovered, and your mastery went up.' : 'The worked answer is shown above. Try another version when you are ready.') : 'Your answers were added to your mastery.'}</Text>}
        </View>
        {!practice && !passed && <Text style={{ color: C.muted, textAlign: 'center' }}>Get at least half right to earn a star and unlock the next level.</Text>}
        {result.showSignup && (
          <View style={{ backgroundColor: '#312E81', borderRadius: R.md, padding: 16, gap: 6 }}>
            <Text style={{ color: C.text, fontWeight: '800' }}>You've cleared {SIGNUP_PROMPT_AFTER_LEVELS} levels. Save your progress?</Text>
            <Text style={{ color: C.muted }}>Accounts arrive in a later milestone. Until then your progress is saved on this device.</Text>
          </View>
        )}
        {retry && result.correct === 0 && (
          <Button label="Try another version" onPress={() => router.replace({ pathname: '/level/[id]', params: { id, r: String(Date.now()) } })} />
        )}
        {practice && <Button label="Back to Learn" secondary={retry && result.correct === 0} onPress={() => router.replace('/learn')} />}
        {passed && nextExists && (
          <Button
            label="Continue Climbing"
            onPress={() => router.replace({ pathname: '/genre/[slug]', params: { slug: level.genre, ...(result.firstClear ? { advance: String(level.n) } : {}) } })}
          />
        )}
        {!practice && passed && !nextExists && <Button label="Back to the trail" onPress={() => router.replace(`/genre/${level.genre}`)} />}
        {!retry && <Button label="Play again" secondary onPress={start} />}
        {!practice && passed && nextExists && (
          <Button label="Next level now" secondary onPress={() => router.replace({ pathname: '/level/[id]', params: { id: `${level.genre}-${level.n + 1}` } })} />
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={shell}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.replace(practice ? '/learn' : `/genre/${level.genre}`)} accessibilityLabel="Quit level">
          <Text style={{ color: C.muted, fontSize: 22 }}>✕</Text>
        </Pressable>
        <View style={{ flex: 1, height: 12, backgroundColor: C.card, borderRadius: 6, overflow: 'hidden' }}>
          <View style={{ width: `${((index + (checked ? 1 : 0)) / level.questions.length) * 100}%`, height: 12, backgroundColor: genre.color }} />
        </View>
        <Text style={{ color: C.muted, fontWeight: '700' }}>{index + 1}/{level.questions.length}</Text>
      </View>

      <Text style={{ color: C.text, fontSize: q.type !== 'sequence' && q.prompt.length > 150 ? 17 : 21, lineHeight: q.type !== 'sequence' && q.prompt.length > 150 ? 25 : 28, fontWeight: '800', marginVertical: 10 }}>
        {q.type === 'sequence' ? 'Fill the missing number.' : q.prompt}
      </Text>

      <QuestionRenderer question={q} value={answer} onChange={setAnswer} locked={checked} correctAnswer={correctAnswerOf(q)} />

      {checked && (
        <View style={{ backgroundColor: validate(q, answer) ? '#14532D' : '#7F1D1D', borderRadius: R.md, padding: 16, gap: 4 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>{validate(q, answer) ? 'Correct!' : 'Not quite'}</Text>
          <Text style={{ color: '#ffffffdd' }}>{q.explanation}</Text>
        </View>
      )}

      <View style={{ marginTop: 'auto', paddingTop: 12 }}>
        {!checked ? (
          <Button label="Check" onPress={check} disabled={answer === null || answer === ''} />
        ) : (
          <Button label={index + 1 < level.questions.length ? 'Next' : 'See result'} onPress={next} />
        )}
      </View>
    </ScrollView>
  );
}
