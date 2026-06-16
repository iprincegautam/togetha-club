'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { BATCH_META } from '@/constants/batches'
import { ROUTES } from '@/constants/routes'
import type { BatchMatchResult, MatchableBatchSlug } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

type Props = {
  answers: QuizAnswers
  batchMatches: BatchMatchResult[]
  initialBatch?: MatchableBatchSlug
  showApplyLink?: boolean
  fetchLive?: boolean
}

const BATCH_ORDER: MatchableBatchSlug[] = ['batch-a', 'batch-b']

export default function MatchPreviewPanel({
  answers,
  batchMatches,
  initialBatch,
  showApplyLink = true,
  fetchLive = true,
}: Props) {
  const recommended =
    batchMatches.find((batch) => batch.recommended)?.batchSlug ??
    batchMatches[0]?.batchSlug ??
    'batch-a'

  const [selectedBatch, setSelectedBatch] = useState<MatchableBatchSlug>(
    initialBatch ?? recommended
  )
  const [liveMatch, setLiveMatch] = useState<BatchMatchResult | null>(null)
  const [loadingLive, setLoadingLive] = useState(false)

  const fallback = useMemo(
    () => batchMatches.find((batch) => batch.batchSlug === selectedBatch) ?? batchMatches[0],
    [batchMatches, selectedBatch]
  )

  useEffect(() => {
    if (!fetchLive || !fallback) return
    setLoadingLive(true)
    fetch('/api/match/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers,
        batchSlug: selectedBatch,
        includeNarrative: true,
      }),
    })
      .then((r) => r.json())
      .then((json) => setLiveMatch(json.match ?? null))
      .catch(() => setLiveMatch(null))
      .finally(() => setLoadingLive(false))
  }, [answers, fetchLive, selectedBatch, fallback])

  const active = liveMatch ?? fallback
  if (!active) return null

  const accent = selectedBatch === 'batch-b' ? 'rose' : 'teal'

  return (
    <div className="match-preview">
      <div className="match-preview-intro">
        <p className="match-preview-eyebrow">✦ AI batch preview</p>
        <h3 className="match-preview-title">Your chances on each batch</h3>
        <p className="match-preview-sub">
          Pick a trip to see your match score, placement likelihood, cohort overlap, and the kind of
          people you&apos;re most likely to connect with.
        </p>
      </div>

      <div className="match-batch-tabs">
        {BATCH_ORDER.map((slug) => {
          const batch = batchMatches.find((row) => row.batchSlug === slug)
          if (!batch) return null
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
                Ages {meta.ageRange} · {batch.matchScore}% fit
              </span>
              {batch.recommended && <em>Best match</em>}
            </button>
          )
        })}
      </div>

      <div className={`match-preview-grid${active.cohortMatchPercent != null ? ' three-up' : ''}`}>
        <div className="match-stat-card">
          <div className="match-stat-value">{active.matchScore}%</div>
          <div className="match-stat-label">Compatibility score</div>
          <p className="match-stat-copy">{active.headline}</p>
        </div>
        <div className="match-stat-card">
          <div className="match-stat-value">{active.placementChance}%</div>
          <div className="match-stat-label">Likely placement chance</div>
          <p className="match-stat-copy">
            If approved, this is how strongly our algorithm would prioritize you for{' '}
            {active.batchLabel.toLowerCase()}.
          </p>
        </div>
        {active.cohortMatchPercent != null && (
          <div className="match-stat-card">
            <div className="match-stat-value">{active.cohortMatchPercent}%</div>
            <div className="match-stat-label">
              Cohort overlap
              {active.cohortSampleSize ? ` · ${active.cohortSampleSize} applicants` : ''}
            </div>
            <p className="match-stat-copy">
              How closely you align with people already in the pipeline for this batch
              {active.cohortStrongMatchPercent != null
                ? ` — ${active.cohortStrongMatchPercent}% look like strong mutual-fit matches.`
                : '.'}
            </p>
          </div>
        )}
      </div>

      {loadingLive && <p className="account-muted match-live-loading">Refreshing live cohort data…</p>}

      {active.ageNote && (
        <p className="match-age-note" role="status">
          {active.ageNote}
        </p>
      )}

      {active.ageEligible === false && (
        <p className="match-age-warning">
          Personality fit is shown for comparison, but placement is unlikely outside your age band.
        </p>
      )}

      {active.aiNarrative && (
        <div className="match-ai-narrative">
          <p className="match-preview-eyebrow">✦ AI read on you</p>
          <p>{active.aiNarrative}</p>
        </div>
      )}

      <div className="match-panel">
        <div className="match-panel-head">
          <Badge color={accent}>✦ {active.batchLabel}</Badge>
          <p className="match-panel-tagline">{active.batchTagline}</p>
        </div>
        <p className="match-panel-summary">{active.summary}</p>

        <h4 className="match-panel-subtitle">People you&apos;re most likely to click with</h4>
        <div className="match-peer-list">
          {active.peerMix.map((peer) => (
            <div key={peer.id} className="match-peer-row">
              <div className="match-peer-top">
                <strong>{peer.label}</strong>
                <span>{peer.percent}%</span>
              </div>
              <div className="match-peer-bar">
                <div className="match-peer-fill" style={{ width: `${peer.percent}%` }} />
              </div>
              <p className="match-peer-copy">{peer.tagline}</p>
            </div>
          ))}
        </div>

        <ul className="match-highlights">
          {active.connectionHighlights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      {showApplyLink && (
        <div className="match-preview-actions">
          <Link href={ROUTES.batchDetail(selectedBatch)} className="rfbtn">
            View {BATCH_META[selectedBatch].label} &amp; book →
          </Link>
          <Link href={ROUTES.match} className="match-secondary-link">
            Open full AI Match Lab →
          </Link>
        </div>
      )}

      <p className="match-footnote">
        Preview only — final batch placement still includes human review. Cohort overlap uses real
        applicant quiz data when available.
      </p>
    </div>
  )
}
