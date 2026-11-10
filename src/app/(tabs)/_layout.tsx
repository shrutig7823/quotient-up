import { Tabs } from 'expo-router';
import { Brain, Map, Swords, type LucideIcon } from 'lucide-react-native';
import { Text } from 'react-native';

import { TAB_BAR_HEIGHT, font } from '@/ui/theme';

const icon = (Icon: LucideIcon) => ({ color }: { color: unknown }) => <Icon size={20} color={String(color)} strokeWidth={2} />;
// Own label component: the default one clips descenders with some fonts.
const label = (title: string) => ({ color }: { color: unknown }) => (
  <Text numberOfLines={1} style={{ fontFamily: font.bold, fontSize: 11, lineHeight: 16, color: String(color), marginTop: 2 }}>{title}</Text>
);

// The four primary tabs from the brief, kept visually light so the world gets the screen.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: 'rgba(8,10,32,0.96)', borderTopColor: 'rgba(255,255,255,0.08)', height: TAB_BAR_HEIGHT, paddingTop: 6, paddingBottom: 8 },
        tabBarIconStyle: { height: 22 },
        tabBarActiveTintColor: '#FFC94D',
        tabBarInactiveTintColor: '#8F93C4',
      }}>
      <Tabs.Screen name="journey" options={{ title: 'Journey', tabBarIcon: icon(Map), tabBarLabel: label('Journey') }} />
      <Tabs.Screen name="arena" options={{ title: 'Arena', tabBarIcon: icon(Swords), tabBarLabel: label('Arena') }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: icon(Brain), tabBarLabel: label('Learn') }} />
    </Tabs>
  );
}
