export const BATCH_META = {
  'batch-a': {
    color: 'var(--teal-stamp)',
    accentColor: 'var(--teal-light)',
    label: 'GenZ Edition',
    tagline: 'Loud. Chaotic. Beautiful.',
    ageRange: '21–26',
  },
  'batch-b': {
    color: 'var(--rose)',
    accentColor: 'var(--rose-light)',
    label: 'Millennial Edition',
    tagline: 'Quieter. Deeper. Just as electric.',
    ageRange: '27–35',
  },
  'batch-c': {
    color: 'var(--lavender)',
    accentColor: 'var(--lavender)',
    label: 'Mystery Edition',
    tagline: "We're not telling you where it is.",
    ageRange: 'TBD',
  },
} as const

export const BATCH_DATE_OPTIONS: Record<
  string,
  { label: string; sublabel: string; soldOut?: boolean }[]
> = {
  'batch-a': [
    { label: 'Friday, 13 June 2026', sublabel: 'Returns Wednesday, 18 June · 5N/6D' },
    { label: 'Friday, 27 June 2026', sublabel: 'Returns Wednesday, 2 July · 5N/6D' },
    { label: 'Friday, 11 July 2026', sublabel: 'Returns Wednesday, 16 July · 5N/6D' },
    { label: 'Friday, 25 July 2026', sublabel: 'Returns Wednesday, 30 July · 5N/6D' },
  ],
  'batch-b': [
    { label: 'Friday, 27 June 2026', sublabel: 'Returns Wednesday, 2 July · 5N/6D' },
    { label: 'Friday, 25 July 2026', sublabel: 'Returns Wednesday, 30 July · 5N/6D' },
    { label: 'Friday, 11 July 2026', sublabel: 'Returns Wednesday, 16 July · 5N/6D' },
  ],
}
