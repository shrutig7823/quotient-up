import { Text, TextInput, View } from 'react-native';

import { C, R, font } from '@/ui/theme';
import type { RendererProps } from './QuestionRenderer';
import type { EntryQuestion } from './types';
import { displayAnswer } from './validate';

const HINT: Record<EntryQuestion['format'], string> = {
  numeric: 'Enter a number. Fractions like 3/10 work too.',
  text: 'Type your answer.',
  order: 'Enter the order, separated by commas (for example B, A, C).',
  coordinate: 'Enter the point as (x, y).',
};

// Typed answer: a number or fraction, a word or code, an ordered list, or a coordinate pair.
export function AnswerEntry({ question, value, onChange, locked }: RendererProps<EntryQuestion>) {
  return (
    <View style={{ gap: 10 }}>
      <TextInput
        value={typeof value === 'string' ? value : ''}
        onChangeText={(t) => onChange(t)}
        editable={!locked}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        keyboardType={question.format === 'numeric' ? 'numbers-and-punctuation' : 'default'}
        placeholder="Your answer"
        placeholderTextColor={C.faint}
        accessibilityLabel="Your answer"
        style={{
          height: 56, borderRadius: R.md, paddingHorizontal: 16, fontSize: 20, fontFamily: font.bold, color: C.text,
          backgroundColor: 'rgba(12,12,40,0.7)', borderWidth: 2, borderColor: locked ? C.line : C.gold, outlineStyle: 'none',
        } as any}
      />
      <Text style={{ fontFamily: font.regular, fontSize: 13, color: C.muted }}>{HINT[question.format]}</Text>
      {locked && <Text style={{ fontFamily: font.medium, fontSize: 13, color: C.muted }}>Correct answer: {displayAnswer(question)}</Text>}
    </View>
  );
}
