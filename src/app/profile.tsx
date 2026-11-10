import { useRouter } from 'expo-router';
import {
  Award, BarChart3, Brain, ChevronLeft, ChevronRight, Coins, Gauge, Info, Layers, RotateCcw, ShieldCheck, Target, Trophy, UserRound, Zap,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AGE_GROUPS, DAILY_MINUTES, GENRES, GOALS } from '@/config/genres';
import { currentAttempts } from '@/content/practice';
import { initialOf, overallAccuracy, profileCompletion } from '@/engine/profile';
import { useGame } from '@/state/gameStore';
import { C, R, S, T, font } from '@/ui/theme';

const GOLD = '#FFC94D';
const INK = '#17163D';
const card = { backgroundColor: 'rgba(16,22,52,0.86)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' } as const;

function Row({ icon, label, value, badge, onPress, danger }: { icon: React.ReactNode; label: string; value?: string; badge?: string; onPress?: () => void; danger?: boolean }) {
  const inner = (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 }}>
      <View style={{ width: 28, alignItems: 'center' }}>{icon}</View>
      <Text style={{ flex: 1, fontFamily: font.bold, fontSize: 15, color: danger ? '#F87171' : C.text }}>{label}</Text>
      {badge && (
        <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: R.pill, backgroundColor: 'rgba(255,201,77,0.16)' }}>
          <Text style={{ fontFamily: font.bold, fontSize: 12, color: GOLD }}>{badge}</Text>
        </View>
      )}
      {value && <Text style={{ fontFamily: font.medium, fontSize: 14, color: C.muted }}>{value}</Text>}
      {onPress && <ChevronRight size={18} color={C.faint} />}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={(st: any) => ({ opacity: st.pressed ? 0.8 : 1, cursor: 'pointer', outlineStyle: 'none' } as any)}>{inner}</Pressable>
  ) : inner;
}
const Divider = () => <View style={{ height: 1, marginLeft: 58, backgroundColor: 'rgba(255,255,255,0.07)' }} />;
const Section = ({ title }: { title: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.sm }}>
    <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: GOLD }} />
    <Text style={[T.card, { fontSize: 17 }]}>{title}</Text>
  </View>
);

function Chips<V extends string | number>({ options, value, onChange, label }: { options: readonly V[]; value: V | null; onChange: (v: V) => void; label: (v: V) => string }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = value === o;
        return (
          <Pressable key={String(o)} onPress={() => onChange(o)} accessibilityRole="button" accessibilityState={{ selected: on }}
            style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1.5, borderColor: on ? GOLD : 'rgba(255,255,255,0.18)', backgroundColor: on ? 'rgba(255,201,77,0.16)' : 'transparent' }}>
            <Text style={{ fontFamily: font.bold, fontSize: 14, color: on ? GOLD : C.text }}>{label(o)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const g = useGame();
  const [editing, setEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [name, setName] = useState(g.displayName ?? '');
  const [age, setAge] = useState<string | null>(g.ageGroup);
  const [goal, setGoal] = useState<string | null>(g.goal);
  const [mins, setMins] = useState<number | null>(g.dailyMinutes);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/journey'));
  const completion = profileCompletion({ displayName: g.displayName, ageGroup: g.ageGroup, goal: g.goal, dailyMinutes: g.dailyMinutes });
  const attempts = useMemo(() => currentAttempts(g.attempts), [g.attempts]);
  const accuracy = overallAccuracy(attempts);
  const cleared = Object.keys(g.levelStars).length;
  const totalLevels = GENRES.reduce((s, x) => s + x.levelCount, 0);
  const shownName = g.displayName?.trim() || 'Guest';

  const header = (title: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Pressable onPress={editing ? () => setEditing(false) : back} accessibilityRole="button" accessibilityLabel="Back" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 }}>
        <ChevronLeft size={26} color={C.text} />
      </Pressable>
      <Text style={[T.h2, { fontSize: 20 }]} accessibilityRole="header">{title}</Text>
    </View>
  );

  if (editing) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#070D24' }} contentContainerStyle={{ alignItems: 'center', paddingTop: 44, paddingBottom: 40 }}>
        <View style={{ width: '100%', maxWidth: 520, paddingHorizontal: S.lg, gap: S.lg }}>
          {header('Your profile')}
          <View style={{ ...card, padding: S.lg, gap: S.lg, overflow: 'visible' }}>
            <View style={{ gap: 8 }}>
              <Text style={T.label}>Name</Text>
              <TextInput value={name} onChangeText={setName} maxLength={24} placeholder="Add a name (optional)" placeholderTextColor={C.faint} accessibilityLabel="Name"
                style={{ height: 52, borderRadius: R.md, paddingHorizontal: 14, fontSize: 17, fontFamily: font.bold, color: C.text, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', outlineStyle: 'none' } as any} />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={T.label}>Age group</Text>
              <Chips options={AGE_GROUPS} value={age as any} onChange={setAge} label={(v) => String(v)} />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={T.label}>What you are preparing for</Text>
              <Chips options={GOALS} value={goal as any} onChange={setGoal} label={(v) => String(v)} />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={T.label}>Daily practice</Text>
              <Chips options={DAILY_MINUTES} value={mins as any} onChange={setMins} label={(v) => `${v} min`} />
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => { g.setProfile({ displayName: name, ageGroup: age, goal, dailyMinutes: mins }); setEditing(false); }}
            style={{ height: 54, borderRadius: R.pill, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: font.heavy, fontSize: 17, color: INK }}>Save</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#070D24' }} contentContainerStyle={{ alignItems: 'center', paddingTop: 44, paddingBottom: 40 }}>
      <View style={{ width: '100%', maxWidth: 520, paddingHorizontal: S.lg, gap: S.lg }}>
        {header('Profile')}

        {/* Who */}
        <View style={{ ...card, padding: S.lg, flexDirection: 'row', alignItems: 'center', gap: S.lg }}>
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,201,77,0.18)', borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: font.heavy, fontSize: 30, color: GOLD }}>{initialOf(g.displayName)}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[T.h2, { fontSize: 22 }]} numberOfLines={1}>{shownName}</Text>
            <Pressable onPress={() => router.push('/learn')} accessibilityRole="button" style={{ minHeight: 28, justifyContent: 'center' }}>
              <Text style={{ fontFamily: font.bold, fontSize: 13, color: GOLD }}>View activity ›</Text>
            </Pressable>
          </View>
        </View>

        {/* Account status: honest about what exists */}
        <View style={{ ...card, borderColor: 'rgba(255,201,77,0.5)', padding: S.lg, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={22} color={GOLD} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: font.heavy, fontSize: 15, color: C.text }}>Playing as a guest</Text>
            <Text style={T.small}>Your progress is saved on this device. Accounts to sync it across devices are coming soon.</Text>
          </View>
        </View>

        {/* Quick tiles */}
        <View style={{ flexDirection: 'row', gap: S.md }}>
          {[{ icon: <Coins size={22} color={GOLD} />, label: 'Coins', value: String(g.coins) }, { icon: <Zap size={22} color={GOLD} fill={GOLD} />, label: 'XP', value: String(g.xp) }].map((t) => (
            <View key={t.label} style={{ ...card, flex: 1, alignItems: 'center', gap: 4, paddingVertical: S.lg }}>
              {t.icon}
              <Text style={{ fontFamily: font.heavy, fontSize: 22, color: C.text }}>{t.value}</Text>
              <Text style={T.small}>{t.label}</Text>
            </View>
          ))}
        </View>

        <Section title="You" />
        <View style={card}>
          <Row icon={<UserRound size={20} color={C.muted} />} label="Your profile" badge={`${completion}% completed`} onPress={() => { setName(g.displayName ?? ''); setAge(g.ageGroup); setGoal(g.goal); setMins(g.dailyMinutes); setEditing(true); }} />
          <Divider />
          <Row icon={<Target size={20} color={C.muted} />} label="Preparing for" value={g.goal ?? 'Not set'} />
          <Divider />
          <Row icon={<Gauge size={20} color={C.muted} />} label="Daily practice" value={g.dailyMinutes ? `${g.dailyMinutes} min` : 'Not set'} />
          <Divider />
          <Row icon={<Info size={20} color={C.muted} />} label="Age group" value={g.ageGroup ?? 'Not set'} />
        </View>

        <Section title="Your progress" />
        <View style={card}>
          <Row icon={<Layers size={20} color={C.muted} />} label="Levels cleared" value={`${cleared} / ${totalLevels}`} />
          <Divider />
          <Row icon={<Trophy size={20} color={C.muted} />} label="Summit keys" value={`${g.masteredGenres.length} / 6`} />
          <Divider />
          <Row icon={<BarChart3 size={20} color={C.muted} />} label="Answer accuracy" value={accuracy === null ? 'No answers yet' : `${accuracy}%`} />
          <Divider />
          <Row icon={<Brain size={20} color={C.muted} />} label="Mastery and mistakes" onPress={() => router.push('/learn')} />
          <Divider />
          <Row icon={<Award size={20} color={C.muted} />} label="Questions answered" value={String(attempts.length)} />
        </View>

        <Section title="Data" />
        <View style={card}>
          {confirmReset ? (
            <View style={{ padding: S.lg, gap: 10 }}>
              <Text style={{ fontFamily: font.bold, fontSize: 15, color: C.text }}>Erase all progress on this device?</Text>
              <Text style={T.small}>This clears your levels, coins, XP, answers and profile. It cannot be undone.</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => setConfirmReset(false)} accessibilityRole="button" style={{ flex: 1, height: 46, borderRadius: R.pill, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: font.bold, color: C.text }}>Keep it</Text>
                </Pressable>
                <Pressable onPress={() => { g.reset(); router.replace('/'); }} accessibilityRole="button" style={{ flex: 1, height: 46, borderRadius: R.pill, backgroundColor: '#B91C1C', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: font.heavy, color: '#fff' }}>Erase</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Row icon={<RotateCcw size={20} color="#F87171" />} label="Reset progress" danger onPress={() => setConfirmReset(true)} />
          )}
        </View>
        <Text style={[T.small, { textAlign: 'center', color: C.faint }]}>Quotient Up · version 1.0</Text>
      </View>
    </ScrollView>
  );
}
