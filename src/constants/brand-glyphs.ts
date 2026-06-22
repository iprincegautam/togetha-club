/**
 * Typographic marks for Togetha.Club — editorial travel-club language.
 * Use instead of emoji for icons, steps, and UI accents.
 */
export const GLYPH = {
  spark: '✦',
  heart: '♡',
  mountain: '△',
  match: '◈',
  arrow: '→',
  dot: '·',
  dash: '—',
  circle: '○',
  plus: '+',
  check: '✓',
  wave: '~',
  home: '⌂',
  letter: '✉',
  cross: '±',
  star: '✧',
  quote: '❝',
} as const

export const HOW_IT_WORKS_GLYPH = {
  quiz: GLYPH.spark,
  ai: GLYPH.match,
  mountains: GLYPH.mountain,
  connection: GLYPH.heart,
} as const

export const TRAIT_GLYPH = {
  personality: '◦',
  communication: GLYPH.wave,
  loveLanguage: GLYPH.heart,
  values: GLYPH.spark,
  humour: GLYPH.dot,
  ambition: '▲',
  energy: GLYPH.circle,
  conflict: GLYPH.cross,
} as const

export const INCLUDE_GLYPH = {
  transport: GLYPH.arrow,
  stay: GLYPH.home,
  meals: '◦',
  games: GLYPH.spark,
  bonfire: GLYPH.heart,
  guide: GLYPH.dot,
  group: GLYPH.circle,
  verify: GLYPH.check,
  safety: GLYPH.plus,
  connection: GLYPH.match,
  letter: GLYPH.letter,
  photo: '◫',
  drinks: '◦',
  music: GLYPH.wave,
  journal: GLYPH.dash,
} as const

export const VIBE_GLYPH = {
  energy: GLYPH.spark,
  unscripted: GLYPH.wave,
  ease: GLYPH.dot,
  mountains: GLYPH.mountain,
  night: GLYPH.circle,
  offline: GLYPH.dash,
  pace: '◦',
  depth: GLYPH.match,
  letter: GLYPH.letter,
  stillness: GLYPH.circle,
  live: GLYPH.wave,
  write: GLYPH.dash,
} as const

export const CLUE_GLYPH = {
  water: GLYPH.wave,
  sunrise: GLYPH.circle,
  format: GLYPH.match,
} as const
