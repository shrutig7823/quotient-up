import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AGE_GROUPS, DAILY_MINUTES, GOALS } from '@/config/genres';
import { useGame } from '@/state/gameStore';
import { C, R } from '@/ui/theme';

// Three quick taps, no test: age, reason for playing, daily practice goal.
export default function Onboarding() {
  const router = useRouter();
  const setOnboarding = useGame((s) => s.setOnboarding);
  const [age, setAge] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);

  const Option = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={{ backgroundColor: C.card, padding: 18, borderRadius: R.md, borderWidth: 1, borderColor: C.line }}>
      <Text style={{ color: C.text, fontSize: 17, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );

  const title = !age ? 'How old are you?' : !goal ? 'Why are you playing?' : 'Set your daily practice goal';

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 70, gap: 12, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
      <Text style={{ color: C.muted, fontWeight: '700' }}>Step {!age ? 1 : !goal ? 2 : 3} of 3</Text>
      <Text style={{ color: C.text, fontSize: 28, fontWeight: '900', marginBottom: 8 }}>{title}</Text>
      <View style={{ gap: 12 }}>
        {!age && AGE_GROUPS.map((a) => <Option key={a} label={a} onPress={() => setAge(a)} />)}
        {age && !goal && GOALS.map((g) => <Option key={g} label={g} onPress={() => setGoal(g)} />)}
        {age && goal &&
          DAILY_MINUTES.map((m) => (
            <Option
              key={m}
              label={`${m} minutes a day`}
              onPress={() => {
                setOnboarding(age, goal, m);
                router.replace('/journey');
              }}
            />
          ))}
      </View>
    </ScrollView>
  );
}
