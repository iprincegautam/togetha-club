'use client'

import { useEffect, useState } from 'react'
import { loadQuizAnswers } from '@/lib/quiz-storage'
import type { BatchMatchResult, MatchableBatchSlug } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

type Props = {
  batchSlug: MatchableBatchSlug
  compact?: boolean
}

export default function ApplyMatchPreview({ batchSlug, compact = false }: Props) {
  const [match, setMatch] = useState<BatchMatchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [missingQuiz, setMissingQuiz] = useState(false)

  useEffect(() => {
    const answers = loadQuizAnswers() as QuizAnswers | null
    if (!answers || Object.keys(answers).length < 3) {
      setMissingQuiz(true)
      setLoading(false)
      return
    }

    fetch('/api/match/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, batchSlug, includeNarrative: true }),
    })
      .then((r) => r.json())
      .then((json) => setMatch(json.match ?? null))
      .catch(() => setMatch(null))
      .finally(() => setLoading(false))
  }, [batchSlug])

  if (loading) {
    return (
      <div className={`apply-match-preview${compact ? ' compact' : ''}`}>
        <p className="account-muted">Calculating your AI match preview…</p>
      </div>
    )
  }

  if (missingQuiz || !match) {
    return (
      <div className={`apply-match-preview${compact ? ' compact' : ''}`}>
        <p className="match-preview-eyebrow">✦ AI match preview</p>
        <p className="apply-match-copy">
          {missingQuiz
            ? 'Take the compatibility quiz first to see how you fit this batch before you pay.'
            : 'We could not load your match preview right now.'}
        </p>
      </div>
    )
  }

  return (
    <div className={`apply-match-preview${compact ? ' compact' : ''}`}>
      <p className="match-preview-eyebrow">✦ AI match preview</p>
      <div className="apply-match-grid">
        <div>
          <div className="apply-match-score">{match.matchScore}%</div>
          <div className="apply-match-label">Batch fit</div>
        </div>
        <div>
          <div className="apply-match-score">{match.placementChance}%</div>
          <div className="apply-match-label">Placement chance</div>
        </div>
        {match.cohortMatchPercent != null && (
          <div>
            <div className="apply-match-score">{match.cohortMatchPercent}%</div>
            <div className="apply-match-label">
              Cohort overlap
              {match.cohortSampleSize ? ` (${match.cohortSampleSize})` : ''}
            </div>
          </div>
        )}
      </div>
      {match.aiNarrative && <p className="apply-match-copy">{match.aiNarrative}</p>}
      {!compact && match.peerMix.length > 0 && (
        <div className="apply-match-peers">
          <strong>Most likely connections</strong>
          {match.peerMix.slice(0, 3).map((peer) => (
            <div key={peer.id} className="apply-match-peer-row">
              <span>{peer.label}</span>
              <span>{peer.percent}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
