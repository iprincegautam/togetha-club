import { BATCH_META } from '@/constants/batches'
import {
  DESTINATIONS,
  getDestinationForBatch,
  isGenzEdition,
  isMillennialEdition,
  type DestinationSlug,
} from '@/constants/destinations'
import type { MatchableBatchSlug } from '@/types/match'

/** Public display name — never expose A/B/D/E letter codes. */
export function batchPublicName(slug: string): string {
  const destination = getDestinationForBatch(slug)
  if (!destination) return BATCH_META[slug as keyof typeof BATCH_META]?.label ?? slug

  const trail = DESTINATIONS[destination].title
  const edition = isGenzEdition(slug)
    ? 'GenZ Edition'
    : isMillennialEdition(slug)
      ? 'Millennial Edition'
      : BATCH_META[slug as keyof typeof BATCH_META]?.label

  return edition ? `${trail} — ${edition}` : trail
}

export function batchTrailTitle(slug: string): string {
  const destination = getDestinationForBatch(slug)
  if (!destination) return 'Togetha Love Trail'
  return DESTINATIONS[destination].title
}

export function batchEditionLabel(slug: string): string {
  if (isGenzEdition(slug)) return 'GenZ Edition'
  if (isMillennialEdition(slug)) return 'Millennial Edition'
  return BATCH_META[slug as keyof typeof BATCH_META]?.label ?? 'Edition'
}

export function batchDestinationShort(slug: string): DestinationSlug | null {
  return getDestinationForBatch(slug)
}

export function isMatchableBatchSlug(slug: string): slug is MatchableBatchSlug {
  return (
    slug === 'batch-a' ||
    slug === 'batch-b' ||
    slug === 'batch-d' ||
    slug === 'batch-e'
  )
}
