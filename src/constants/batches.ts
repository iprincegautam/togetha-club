export const BATCH_META = {
  'batch-a': {
    color: 'var(--teal-stamp)',
    accentColor: 'var(--teal-light)',
    label: 'GenZ Edition',
    tagline: 'Loud. Chaotic. Beautiful.',
    ageRange: '18–25',
  },
  'batch-b': {
    color: 'var(--rose)',
    accentColor: 'var(--rose-light)',
    label: 'Millennial Edition',
    tagline: 'Quieter. Deeper. Just as electric.',
    ageRange: '26–36',
  },
  'batch-c': {
    color: 'var(--lavender)',
    accentColor: 'var(--lavender)',
    label: 'Mystery Edition',
    tagline: "We're not telling you where it is.",
    ageRange: 'TBD',
  },
} as const

import { getFallbackDateOptions } from '@/lib/batch-departure-dates'

/** Visible Friday departures (next 6 weeks) for a batch slug. */
export function getBatchDateOptions(batchSlug: string) {
  return getFallbackDateOptions(batchSlug)
}
