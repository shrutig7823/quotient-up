import { Pressable, Text, View } from 'react-native';

import { C, R } from '@/ui/theme';
import type { RendererProps } from './QuestionRenderer';
import type { SequenceQuestion } from './types';

// Tap a number to drop it into the blank. Tap the blank again to take it back.
export function SequenceFill({ question, value, onChange, locked, correctAnswer }: RendererProps<SequenceQuestion>) {
  const box = { minWidth: 54, height: 58, borderRadius: R.sm, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 8 };
  const right = locked && value === correctAnswer;
  const wrong = locked && value !== correctAnswer;
  return (
    <View style={{ gap: 28 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {question.sequence.map((n, i) =>
          n !== null ? (
            <View key={i} style={{ ...box, backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}>
              <Text style={{ color: C.text, fontSize: 22, fontWeight: '800' }}>{n}</Text>
            </View>
          ) : (
            <Pressable
              key={i}
              disabled={locked || value === null}
              onPress={() => onChange(null)}
              style={{
                ...box, borderWidth: 2, borderStyle: 'dashed',
                borderColor: right ? C.good : wrong ? '#EF4444' : C.gold,
                backgroundColor: right ? '#14532D' : wrong ? '#7F1D1D' : '#00000033',
              }}>
              <Text style={{ color: C.text, fontSize: 22, fontWeight: '800' }}>{value ?? '?'}</Text>
            </Pressable>
          ),
        )}
      </View>
      {locked && wrong && (
        <Text style={{ color: C.muted, textAlign: 'center' }}>Correct number: {correctAnswer}</Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {question.choices.map((c) => {
          const used = value === c;
          return (
            <Pressable
              key={c}
              disabled={locked || used}
              onPress={() => onChange(c)}
              style={{ ...box, minWidth: 70, backgroundColor: used ? C.line : C.gold, opacity: used ? 0.4 : 1, borderBottomWidth: 4, borderBottomColor: '#CA8A04' }}>
              <Text style={{ color: '#1F2937', fontSize: 22, fontWeight: '900' }}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
