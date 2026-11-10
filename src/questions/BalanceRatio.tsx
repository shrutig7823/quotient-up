import { Pressable, Text, View } from 'react-native';

import { C, R } from '@/ui/theme';
import type { RendererProps } from './QuestionRenderer';
import type { BalanceQuestion } from './types';

// A see-saw. Left pan is fixed; dial the right pan until left : right matches the ratio.
// The beam is level only when the ratio is exactly right.
export function BalanceRatio({ question, value, onChange, locked, correctAnswer }: RendererProps<BalanceQuestion>) {
  const [a, b] = question.ratio;
  const right = typeof value === 'number' ? value : 0;
  // >0: left side is heavier (too few on the right). 0: balanced.
  const imbalance = question.leftValue * b - right * a;
  const scale = Math.max(question.leftValue * b, 1);
  const deg = -Math.max(-14, Math.min(14, (imbalance / scale) * 14));
  const balanced = imbalance === 0;
  const ok = locked && value === correctAnswer;
  const bad = locked && value !== correctAnswer;

  const Step = ({ label, delta }: { label: string; delta: number }) => (
    <Pressable
      disabled={locked}
      onPress={() => onChange(Math.max(0, Math.min(question.max, right + delta)))}
      style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: '#CA8A04', opacity: locked ? 0.5 : 1 }}>
      <Text style={{ fontSize: 28, fontWeight: '900', color: '#1F2937' }}>{label}</Text>
    </Pressable>
  );

  const Pan = ({ label, n, accent }: { label: string; n: number; accent: string }) => (
    <View style={{ alignItems: 'center', width: 110 }}>
      <View style={{ backgroundColor: accent, borderRadius: R.md, paddingVertical: 12, paddingHorizontal: 10, minWidth: 90, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{n}</Text>
        <Text style={{ color: '#ffffffdd', fontSize: 13, fontWeight: '700' }}>{label}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ gap: 22, alignItems: 'center' }}>
      <Text style={{ color: C.muted, fontWeight: '700' }}>
        {question.leftLabel} : {question.rightLabel} = {a} : {b}
      </Text>

      <View style={{ height: 150, width: 300, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ width: 300, alignItems: 'center', transform: [{ rotate: `${deg}deg` }] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 280 }}>
            <Pan label={question.leftLabel} n={question.leftValue} accent="#2563EB" />
            <Pan label={question.rightLabel} n={right} accent={ok ? C.good : bad ? '#DC2626' : '#DB2777'} />
          </View>
          <View style={{ height: 8, width: 280, backgroundColor: C.muted, borderRadius: 4, marginTop: 6 }} />
        </View>
        <View style={{ width: 0, height: 0, borderLeftWidth: 18, borderRightWidth: 18, borderBottomWidth: 30, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: C.line }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <Step label="−" delta={-1} />
        <Text style={{ color: C.text, fontSize: 30, fontWeight: '900', minWidth: 60, textAlign: 'center' }}>{right}</Text>
        <Step label="+" delta={1} />
      </View>
      <Text style={{ color: balanced ? C.good : C.muted, fontWeight: '700' }}>
        {locked ? (ok ? 'Balanced!' : `Balanced at ${correctAnswer}`) : balanced ? 'Looks balanced' : 'Not balanced yet'}
      </Text>
    </View>
  );
}
