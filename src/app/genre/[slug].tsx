import { useLocalSearchParams } from 'expo-router';

import { WorldTrail } from '@/scene/WorldTrail';

// A category opens into its own world: scenery, a winding trail of levels, and the Mastery Trial at the end.
export default function GenreTrail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <WorldTrail slug={slug} />;
}
