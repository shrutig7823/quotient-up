import { Text } from 'react-native';

import { AnswerEntry } from './AnswerEntry';
import { BalanceRatio } from './BalanceRatio';
import { ChoiceList } from './ChoiceList';
import { MultipleChoice } from './MultipleChoice';
import { SequenceFill } from './SequenceFill';
import type { Answer, Question } from './types';

// Every renderer is controlled: the level screen owns the answer, the renderer only draws it.
export type RendererProps<Q extends Question> = {
  question: Q;
  value: Answer | null;
  onChange: (v: Answer | null) => void;
  locked: boolean; // true after "Check": show right/wrong, stop editing
  correctAnswer: Answer;
};

// Add a new question type here (plus its type in types.ts and a rule in validate.ts).
export function QuestionRenderer(props: RendererProps<Question>) {
  const { question } = props;
  switch (question.type) {
    case 'choice':
      return <ChoiceList {...(props as RendererProps<typeof question>)} question={question} />;
    case 'entry':
      return <AnswerEntry {...(props as RendererProps<typeof question>)} question={question} />;
    case 'mcq':
      return <MultipleChoice {...(props as RendererProps<typeof question>)} question={question} />;
    case 'sequence':
      return <SequenceFill {...(props as RendererProps<typeof question>)} question={question} />;
    case 'balance':
      return <BalanceRatio {...(props as RendererProps<typeof question>)} question={question} />;
    default:
      // A malformed or unknown question must never crash the level.
      return <Text style={{ color: '#F87171' }}>This question could not be shown.</Text>;
  }
}
