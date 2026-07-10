import type { MatchableBatchSlug } from '@/types/match'

export type DestinationSlug = 'himalayan' | 'udaipur'

export type BatchProductSlug =
  | 'batch-a'
  | 'batch-b'
  | 'batch-c'
  | 'batch-d'
  | 'batch-e'

export type BookableBatchSlug = MatchableBatchSlug

export const DESTINATION_SLUGS: DestinationSlug[] = ['himalayan', 'udaipur']

export const BOOKABLE_BATCH_SLUGS: BookableBatchSlug[] = [
  'batch-a',
  'batch-b',
  'batch-d',
  'batch-e',
]

export type DestinationMeta = {
  slug: DestinationSlug
  title: string
  shortTitle: string
  stops: string
  duration: string
  tagline: string
  catalogTitle: string
  catalogEmphasis: string
  accentColor: string
  catalogCardClass: string
  genzSlug: BookableBatchSlug
  millennialSlug: BookableBatchSlug
  ageSummary: string
}

export const DESTINATIONS: Record<DestinationSlug, DestinationMeta> = {
  himalayan: {
    slug: 'himalayan',
    title: 'Himalayan Love Trail',
    shortTitle: 'Himalayan',
    stops: 'Manali · Kasol · Sissu',
    duration: '5N/6D',
    tagline: 'Electric. Real. Yours.',
    catalogTitle: 'For the unfiltered ones.',
    catalogEmphasis: 'unfiltered',
    accentColor: 'var(--teal-stamp)',
    catalogCardClass: 'himalayan',
    genzSlug: 'batch-a',
    millennialSlug: 'batch-b',
    ageSummary: 'GenZ 18–25 · Millennial 26–36',
  },
  udaipur: {
    slug: 'udaipur',
    title: 'Udaipur Love Trail',
    shortTitle: 'Udaipur',
    stops: 'Udaipur · Kumbhalgarh',
    duration: '2N/3D',
    tagline: 'Three days in the City of Lakes with your verified batch.',
    catalogTitle: 'For the romantic ones.',
    catalogEmphasis: 'romantic',
    accentColor: 'var(--gold)',
    catalogCardClass: 'udaipur',
    genzSlug: 'batch-d',
    millennialSlug: 'batch-e',
    ageSummary: 'GenZ 18–25 · Millennial 26–36',
  },
}

const BATCH_TO_DESTINATION: Record<BookableBatchSlug, DestinationSlug> = {
  'batch-a': 'himalayan',
  'batch-b': 'himalayan',
  'batch-d': 'udaipur',
  'batch-e': 'udaipur',
}

export function isDestinationSlug(value: string): value is DestinationSlug {
  return value === 'himalayan' || value === 'udaipur'
}

export function isBookableBatchSlug(value: string): value is BookableBatchSlug {
  return (
    value === 'batch-a' ||
    value === 'batch-b' ||
    value === 'batch-d' ||
    value === 'batch-e'
  )
}

export function getDestinationForBatch(slug: string): DestinationSlug | null {
  if (!isBookableBatchSlug(slug)) return null
  return BATCH_TO_DESTINATION[slug]
}

export function getEditionSlugsForDestination(
  destination: DestinationSlug
): [BookableBatchSlug, BookableBatchSlug] {
  const meta = DESTINATIONS[destination]
  return [meta.genzSlug, meta.millennialSlug]
}

export function getDefaultBatchForDestination(destination: DestinationSlug): BookableBatchSlug {
  return DESTINATIONS[destination].genzSlug
}

export function resolveRouteSlug(slug: string): BookableBatchSlug | null {
  if (isBookableBatchSlug(slug)) return slug
  if (isDestinationSlug(slug)) return getDefaultBatchForDestination(slug)
  return null
}

export function isGenzEdition(slug: string): boolean {
  return slug === 'batch-a' || slug === 'batch-d'
}

export function isMillennialEdition(slug: string): boolean {
  return slug === 'batch-b' || slug === 'batch-e'
}

export function buildDestinationTripMetaLine(
  destination: DestinationSlug,
  shortDates: string
): string {
  const meta = DESTINATIONS[destination]
  return `${meta.stops} · ${meta.duration} · ${shortDates}`
}
