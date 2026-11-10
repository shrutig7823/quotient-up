import { Pressable, Text, View } from 'react-native';

import { C, R, font } from '@/ui/theme';
import type { RendererProps } from './QuestionRenderer';
import type { ChoiceQuestion } from './types';

// Options are validated by stable id (never by position). Authored order is kept for Yes/No and
// lettered sets; generated questions arrive already shuffled. Three or more options get A, B, C, D badges.
export function ChoiceList({ question, value, onChange, locked }: RendererProps<ChoiceQuestion>) {
  const lettered = question.choices.length >= 3;
  return (
    <View style={{ gap: 10 }}>
      {question.choices.map((c, i) => {
        const selected = value === c.id;
        const isRight = locked && c.id === question.answerId;
        const isWrong = locked && selected && c.id !== question.answerId;
        const accent = isRight ? C.good : isWrong ? '#EF4444' : selected ? C.gold : C.line;
        return (
          <Pressable
            key={c.id}
            disabled={locked}
            onPress={() => onChange(c.id)}
            accessibilityRole="button"
            accessibilityLabel={`${lettered ? 'ABCDEFGH'[i] + ': ' : ''}${c.label}`}
            style={{
              minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 14, borderRadius: R.md, borderWidth: 2,
              backgroundColor: isRight ? '#14532D' : isWrong ? '#7F1D1D' : 'rgba(12,12,40,0.7)', borderColor: accent,
            }}>
            {lettered && (
              <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: accent, alignItems: 'center', justifyContent: 'center', backgroundColor: selected || isRight || isWrong ? accent : 'transparent' }}>
                <Text style={{ fontFamily: font.heavy, fontSize: 15, color: selected || isRight || isWrong ? '#17163D' : C.text }}>{'ABCDEFGH'[i]}</Text>
              </View>
            )}
            <Text style={{ flex: 1, color: C.text, fontSize: 17, fontFamily: font.bold }}>
              {isRight ? '✓ ' : isWrong ? '✗ ' : ''}{c.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
