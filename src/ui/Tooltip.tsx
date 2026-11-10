import { Pressable, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { C, font } from '@/ui/theme';

const GOLD = '#FFC94D';

// A small bubble with an arrow pointing up at its target. Place it absolutely under the target;
// `arrowRight` is the distance from the bubble's right edge to the arrow's centre.
// Visibility is a plain style (never an animation value), so it shows even if animation frames are paused;
// on web a CSS transition gives a soft fade unless the person prefers reduced motion.
export function Tooltip({
  visible, text, onDismiss, arrowRight = 22, maxWidth = 260, style,
}: { visible: boolean; text: string; onDismiss: () => void; arrowRight?: number; maxWidth?: number; style?: object }) {
  const calm = useReducedMotion();
  return (
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        { position: 'absolute', zIndex: 40, maxWidth, opacity: visible ? 1 : 0, transform: [{ translateY: visible || calm ? 0 : -6 }] },
        style,
        { transitionProperty: 'opacity, transform', transitionDuration: calm ? '0ms' : '220ms' } as any,
      ]}>
      {/* arrow */}
      <View style={{ position: 'absolute', top: -6, right: arrowRight - 6, width: 12, height: 12, backgroundColor: '#17163D', borderLeftWidth: 1.5, borderTopWidth: 1.5, borderColor: GOLD, transform: [{ rotate: '45deg' }] }} />
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={`${text} Tap to dismiss.`}
        style={{ paddingVertical: 9, paddingHorizontal: 13, borderRadius: 14, backgroundColor: '#17163D', borderWidth: 1.5, borderColor: GOLD, boxShadow: '0 8px 22px rgba(0,0,0,0.5)' } as any}>
        <Text style={{ fontFamily: font.bold, fontSize: 13, lineHeight: 18, color: C.text }}>{text}</Text>
      </Pressable>
    </View>
  );
}
