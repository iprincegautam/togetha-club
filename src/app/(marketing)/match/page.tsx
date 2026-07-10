import MatchLabClient from '@/components/match/MatchLabClient'
import { buildMetadata } from '@/lib/metadata'
import type { DestinationSlug } from '@/constants/destinations'
import { getDestinationForBatch, isDestinationSlug } from '@/constants/destinations'
import type { MatchableBatchSlug } from '@/types/match'

export function generateMetadata() {
  return buildMetadata(
    'AI Match Lab — Togetha.Club',
    'See your compatibility score, placement chances, and peer mix for each batch edition.'
  )
}

type PageProps = {
  searchParams: Promise<{ batch?: string; destination?: string }>
}

function parseBatch(value: string | undefined): MatchableBatchSlug | undefined {
  if (
    value === 'batch-a' ||
    value === 'batch-b' ||
    value === 'batch-d' ||
    value === 'batch-e'
  ) {
    return value
  }
  return undefined
}

function parseDestination(value: string | undefined): DestinationSlug | undefined {
  if (value && isDestinationSlug(value)) return value
  return undefined
}

export default async function MatchLabPage({ searchParams }: PageProps) {
  const { batch, destination } = await searchParams
  const initialBatch = parseBatch(batch)
  const initialDestination =
    parseDestination(destination) ??
    (initialBatch ? getDestinationForBatch(initialBatch) ?? undefined : undefined)

  return (
    <div className="match-page">
      <MatchLabClient
        initialBatch={initialBatch}
        initialDestination={initialDestination}
      />
    </div>
  )
}
