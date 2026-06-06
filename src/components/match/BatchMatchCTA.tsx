'use client'

import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import type { MatchableBatchSlug } from '@/types/match'

type Props = {
  batchSlug: MatchableBatchSlug
}

export default function BatchMatchCTA({ batchSlug }: Props) {
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
      <Link href={`${ROUTES.match}?batch=${batchSlug}`} className="apply-submit">
        Check my match chances →
      </Link>
    </div>
  )
}
