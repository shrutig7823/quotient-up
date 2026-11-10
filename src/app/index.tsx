import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useGame } from '@/state/gameStore';
import { C, R } from '@/ui/theme';

// Entry: returning players skip straight to the map; new players tap "Start Playing".
export default function Entry() {
  const router = useRouter();
  const { hasStarted, goal, startGuest } = useGame();
  const [hydrated, setHydrated] = useState(useGame.persist.hasHydrated());

  useEffect(() => useGame.persist.onFinishHydration(() => setHydrated(true)), []);

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  if (hasStarted) return <Redirect href={goal ? '/journey' : '/onboarding'} />;

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 14 }}>
      <Text style={{ fontSize: 60, textAlign: 'center' }}>⛰️</Text>
      <Text style={{ color: C.text, fontSize: 38, fontWeight: '900', textAlign: 'center' }}>Quotient Up</Text>
      <Text style={{ color: C.muted, fontSize: 16, textAlign: 'center', marginBottom: 30 }}>
        Climb six aptitude trails. Reach the top.
      </Text>
      <Pressable
        onPress={() => {
          startGuest();
          router.replace('/onboarding');
        }}
        style={{ backgroundColor: C.gold, padding: 18, borderRadius: R.md }}>
        <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#1F2937' }}>Start Playing</Text>
      </Pressable>
    </View>
  );
}
