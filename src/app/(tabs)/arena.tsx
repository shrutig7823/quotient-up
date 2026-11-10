import { Text, View } from 'react-native';

import { C } from '@/ui/theme';

export default function Arena() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 8 }}>
      <Text style={{ fontSize: 48 }}>⚔️</Text>
      <Text style={{ color: C.text, fontSize: 24, fontWeight: '900' }}>Arena</Text>
      <Text style={{ color: C.muted, textAlign: 'center' }}>
        Daily Challenge and weekly Survival Rooms arrive in later milestones.
      </Text>
    </View>
  );
}
