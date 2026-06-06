import MatchLabClient from '@/components/match/MatchLabClient'
import { buildMetadata } from '@/lib/metadata'
import type { MatchableBatchSlug } from '@/types/match'

export function generateMetadata() {
  return buildMetadata(
    'AI Match Lab — Togetha.Club',
    'See your compatibility score, placement chances, and peer mix for each Himalayan batch.'
  )
}

type PageProps = {
  searchParams: Promise<{ batch?: string }>
}

function parseBatch(value: string | undefined): MatchableBatchSlug | undefined {
  if (value === 'batch-a' || value === 'batch-b') return value
  return undefined
}

export default async function MatchLabPage({ searchParams }: PageProps) {
  const { batch } = await searchParams

  return (
    <div className="match-page">
      <MatchLabClient initialBatch={parseBatch(batch)} />
    </div>
  )
}
