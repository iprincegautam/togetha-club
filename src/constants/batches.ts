export const BATCH_META = {
  'batch-a': {
    color: 'var(--teal-stamp)',
    accentColor: 'var(--teal-light)',
    label: 'GenZ Edition',
    tagline: 'Electric. Real. Yours.',
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
  'batch-d': {
    color: 'var(--gold)',
    accentColor: 'var(--gold-light)',
    label: 'GenZ Edition',
    tagline: 'City of Lakes. Verified singles. Show up.',
    ageRange: '18–25',
  },
  'batch-e': {
    color: 'var(--rose)',
    accentColor: 'var(--rose-light)',
    label: 'Millennial Edition',
    tagline: 'City of Lakes. Verified singles. Show up.',
    ageRange: '26–36',
  },
} as const

import { getFallbackDateOptions } from '@/lib/batch-departure-dates'

/** Visible Friday departures (next 6 weeks) for a batch slug. */
export function getBatchDateOptions(batchSlug: string) {
  return getFallbackDateOptions(batchSlug)
}
