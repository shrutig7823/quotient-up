import { Pressable, Text, View } from 'react-native';

import { C, R } from '@/ui/theme';
import type { RendererProps } from './QuestionRenderer';
import type { McqQuestion } from './types';

export function MultipleChoice({ question, value, onChange, locked, correctAnswer }: RendererProps<McqQuestion>) {
  return (
    <View style={{ gap: 10 }}>
      {question.options.map((opt, i) => {
        const selected = value === i;
        const isRight = locked && i === correctAnswer;
        const isWrong = locked && selected && i !== correctAnswer;
        return (
          <Pressable
            key={i}
            disabled={locked}
            onPress={() => onChange(i)}
            accessibilityRole="button"
            style={{
              padding: 16, borderRadius: R.md, borderWidth: 2,
              backgroundColor: isRight ? '#14532D' : isWrong ? '#7F1D1D' : C.card,
              borderColor: isRight ? C.good : isWrong ? '#EF4444' : selected ? C.gold : C.line,
            }}>
            <Text style={{ color: C.text, fontSize: 17, fontWeight: '700' }}>
              {isRight ? '✓ ' : isWrong ? '✗ ' : ''}{opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
