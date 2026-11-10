// Design tokens: one place for colour, spacing, radius, type and shadow.
export const C = {
  bg: '#0F172A',
  sky: '#1B1A45', // deep indigo page background
  surface: '#262459', // raised cards on the indigo
  surfaceHi: '#2F2C6B',
  plum: '#2D2150', // the Summit surface
  card: '#1E293B',
  text: '#F4F5FB',
  muted: '#A5A8CE', // readable on indigo (contrast > 7:1)
  faint: '#7E82B0',
  gold: '#F5C84B',
  goldSoft: '#F5C84B33',
  line: '#3A3873',
  locked: '#475569',
  good: '#22C55E',
};

export const R = { sm: 10, md: 16, lg: 24, pill: 999 };

// Height of the bottom navigation. Screens that must fit without scrolling subtract this.
export const TAB_BAR_HEIGHT = 72;

// Spacing scale (use these, not ad-hoc numbers).
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// One rounded sans-serif (Nunito) in four weights; loaded in app/_layout.tsx.
export const font = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
};

export const T = {
  h1: { fontFamily: font.heavy, fontSize: 28, lineHeight: 34, color: C.text, letterSpacing: -0.3 },
  h2: { fontFamily: font.heavy, fontSize: 24, lineHeight: 30, color: C.text },
  card: { fontFamily: font.bold, fontSize: 17, lineHeight: 22, color: C.text },
  body: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: C.muted },
  small: { fontFamily: font.medium, fontSize: 12, lineHeight: 16, color: C.muted },
  label: { fontFamily: font.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4, textTransform: 'uppercase' as const },
};

// Shadows as CSS-style strings (react-native-web and native new-arch both accept `boxShadow`).
export const shadow = {
  card: '0 6px 0 rgba(8,7,30,0.55), 0 10px 22px rgba(8,7,30,0.35)',
  cardHover: '0 10px 0 rgba(8,7,30,0.55), 0 16px 30px rgba(8,7,30,0.45)',
  cardPressed: '0 2px 0 rgba(8,7,30,0.55), 0 3px 8px rgba(8,7,30,0.3)',
  summit: '0 18px 44px rgba(8,7,30,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
};
