import { BookOpen, Briefcase, Calculator, ChartColumn, Puzzle, Shapes, type LucideIcon } from 'lucide-react-native';

// One icon family (Lucide line icons) for every genre, replacing the mixed emoji.
const ICONS: Record<string, LucideIcon> = {
  quant: Calculator,
  logic: Puzzle,
  data: ChartColumn,
  verbal: BookOpen,
  spatial: Shapes,
  applied: Briefcase,
};

export function GenreIcon({ slug, size = 24, color = '#fff' }: { slug: string; size?: number; color?: string }) {
  const Icon = ICONS[slug] ?? Shapes;
  return <Icon size={size} color={color} strokeWidth={2} />;
}
