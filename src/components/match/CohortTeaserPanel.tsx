'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BATCH_META } from '@/constants/batches'
import { ROUTES } from '@/constants/routes'
import { buildCohortTeasers } from '@/lib/match-cohort-preview'
import type { BatchMatchResult, MatchableBatchSlug } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

type Props = {
  answers: QuizAnswers
  batchMatches: BatchMatchResult[]
  initialBatch?: MatchableBatchSlug
}

const BATCH_ORDER: MatchableBatchSlug[] = ['batch-a', 'batch-b']

export default function CohortTeaserPanel({ answers, batchMatches, initialBatch }: Props) {
  const recommended =
    batchMatches.find((batch) => batch.recommended)?.batchSlug ??
    batchMatches[0]?.batchSlug ??
    'batch-a'

  const [selectedBatch, setSelectedBatch] = useState<MatchableBatchSlug>(
    initialBatch ?? recommended
  )

  const teasers = useMemo(() => buildCohortTeasers(answers, batchMatches), [answers, batchMatches])
  const activeMatch = batchMatches.find((batch) => batch.batchSlug === selectedBatch) ?? batchMatches[0]
  const teaser = teasers[selectedBatch]

  if (!teaser || !activeMatch) return null

  const accent = selectedBatch === 'batch-b' ? 'rose' : 'teal'

  return (
    <div className="cohort-teaser">
      <div className="cohort-teaser-head">
        <p className="match-preview-eyebrow">✦ People already in your lane</p>
        <h3 className="cohort-teaser-title">
          On {teaser.batchLabel}, our AI found{' '}
          <span className={`cohort-teaser-count cohort-teaser-count-${accent}`}>
            {teaser.likeYouCount} people
          </span>{' '}
          like
          you
        </h3>
        <p className="cohort-teaser-sub">
          Same vibe. Similar values. Already moving toward this batch — identities stay hidden until
          you&apos;re approved.
        </p>
      </div>

      <div className="match-batch-tabs">
        {BATCH_ORDER.map((slug) => {
          const batch = batchMatches.find((row) => row.batchSlug === slug)
          const rowTeaser = teasers[slug]
          if (!batch || !rowTeaser) return null
          const meta = BATCH_META[slug]
          return (
            <button
              key={slug}
              type="button"
              className={`match-batch-tab${selectedBatch === slug ? ' active' : ''}`}
              onClick={() => setSelectedBatch(slug)}
            >
              <strong>{meta.label}</strong>
              <span>
                {rowTeaser.likeYouCount} like you · {batch.matchScore}% fit
              </span>
              {batch.recommended && <em>Best match</em>}
            </button>
          )
        })}
      </div>

      <div className="cohort-urgency">
        <div>
          <strong>{teaser.urgencyLine}</strong>
          <p>
            {teaser.spotsRemainingM} boys · {teaser.spotsRemainingF} girls still open — batches fill
            before dates sell out on the site.
          </p>
        </div>
        <div className="cohort-urgency-pill">Filling fast</div>
      </div>

      {activeMatch.ageNote && <p className="match-age-note">{activeMatch.ageNote}</p>}

      <div className="cohort-people-grid">
        {teaser.people.map((person) => (
          <div key={person.id} className="cohort-person-card">
            <div className={`cohort-avatar ${person.avatarClass}`}>{person.displayName.charAt(0)}</div>
            <div className="cohort-person-body">
              <div className="cohort-person-name cohort-teaser-blur">{person.displayName}</div>
              <div className="cohort-person-role">{person.role}</div>
              <div className="cohort-person-org cohort-teaser-blur">{person.orgLine}</div>
              <div className="cohort-person-vibe">{person.vibeLabel}</div>
            </div>
            <div className="cohort-lock">🔒</div>
          </div>
        ))}
      </div>

      {teaser.likeYouCount > teaser.people.length && (
        <p className="cohort-more-muted">
          + {teaser.likeYouCount - teaser.people.length} more profiles like yours in review — unlock
          after you apply.
        </p>
      )}

      <div className="cohort-teaser-actions">
        <Link
          href={ROUTES.batchDetail(selectedBatch)}
          className={`rfbtn cohort-apply-btn${accent === 'rose' ? ' rose' : ''}`}
        >
          Apply for your slot →
        </Link>
        <p className="cohort-apply-note">
          Opens {BATCH_META[selectedBatch].label} ({BATCH_META[selectedBatch].ageRange}) — pick your
          departure date and complete booking there.
        </p>
      </div>
    </div>
  )
}
