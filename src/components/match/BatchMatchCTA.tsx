'use client'

import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import type { DestinationSlug } from '@/constants/destinations'
import type { MatchableBatchSlug } from '@/types/match'

type Props = {
  batchSlug: MatchableBatchSlug
  destination?: DestinationSlug
}

export default function BatchMatchCTA({ batchSlug, destination }: Props) {
  const matchHref = destination
    ? ROUTES.matchForDestination(destination, batchSlug)
    : ROUTES.matchForBatch(batchSlug)

  return (
    <div className="match-batch-cta">
      <div>
        <p className="match-preview-eyebrow">✦ AI preview</p>
        <h3 className="match-batch-cta-title">Curious how you&apos;d fit this batch?</h3>
        <p className="match-batch-cta-copy">
          Take the quiz and our AI will show your match score, placement likelihood, and the kind of
          people you&apos;re most likely to connect with on this trip.
        </p>
      </div>
      <Link href={matchHref} className="apply-submit">
        Check my match chances →
      </Link>
    </div>
  )
}
