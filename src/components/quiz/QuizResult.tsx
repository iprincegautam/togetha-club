'use client'

import { useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import MatchPreviewPanel from '@/components/match/MatchPreviewPanel'
import CohortTeaserPanel from '@/components/match/CohortTeaserPanel'
import { BATCH_AGE_LIMITS, parseQuizAge } from '@/lib/batch-age'
import { ROUTES } from '@/constants/routes'
import type { QuizAnswers, QuizResult as QuizResultType } from '@/types/quiz'

interface QuizResultProps {
  result: QuizResultType
  answers: QuizAnswers
  onSubmit: (name: string, email: string) => Promise<void>
}

const BATCH_LABELS: Record<QuizResultType['batchRecommendation'], string> = {
  'batch-a': 'Batch A — GenZ Edition',
  'batch-b': 'Batch B — Millennial Edition',
}

export default function QuizResult({ result, answers, onSubmit }: QuizResultProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const badgeColor = result.batchRecommendation === 'batch-b' ? 'rose' : 'teal'
  const userAge = parseQuizAge(answers)
  const recommendedMatch = result.batchMatches?.find(
    (batch) => batch.batchSlug === result.batchRecommendation
  )

  const title = result.isHighMatch
    ? 'High probability. Our AI is excited about this one.'
    : recommendedMatch?.ageEligible === false
      ? 'Strong personality fit — check your age band below.'
      : "Good fit. A few curveballs that'll make you interesting."

  const description =
    userAge !== null
      ? `You're ${userAge}. ${BATCH_LABELS[result.batchRecommendation]} is for ages ${
          result.batchRecommendation === 'batch-a'
            ? BATCH_AGE_LIMITS['batch-a'].label
            : BATCH_AGE_LIMITS['batch-b'].label
        }. Explore your fit on each trip below, then apply when you're ready.`
      : result.isHighMatch
        ? "Your answers suggest you're emotionally available, self-aware, and exactly the kind of person our algorithm places at the centre of a batch. Explore your fit on each trip below, then apply when you're ready."
        : "Your answers show depth and originality — exactly what makes for genuine connection. Compare your fit across batches below, then apply when you're ready."

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !email.includes('@')) {
      setError('Please fill in your name and a valid email.')
      return
    }

    setLoading(true)
    try {
      await onSubmit(name.trim(), email.trim())
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="qresult">
      <Badge color={badgeColor} className="res-badge">
        ✦ {BATCH_LABELS[result.batchRecommendation]}
      </Badge>
      <div className="res-score">{result.score}%</div>
      <div className="res-score-lbl">AI Compatibility Match Score</div>
      <h3 className="res-title">{title}</h3>
      <p className="res-desc">{description}</p>

      {result.batchMatches && result.batchMatches.length > 0 && (
        <>
          <CohortTeaserPanel
            answers={answers}
            batchMatches={result.batchMatches}
            initialBatch={result.batchRecommendation}
          />
          <MatchPreviewPanel
            answers={answers}
            batchMatches={result.batchMatches}
            initialBatch={result.batchRecommendation}
            showApplyLink={false}
          />
        </>
      )}

      <form className="res-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="rfinput"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading || success}
        />
        <input
          type="email"
          className="rfinput"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || success}
        />
        {error && (
          <p className="quiz-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="rfbtn rfbtn-secondary" disabled={loading || success}>
          {loading ? '...' : success ? '✓ Saved!' : 'Or save my results & get contacted →'}
        </button>
        {success && (
          <p className="quiz-success">
            ✓ Application received! We&apos;ll reach out within 48 hours.
          </p>
        )}
      </form>

      <div className="quiz-result-link">
        <Link href={ROUTES.batches}>View detailed batch pages →</Link>
      </div>
    </div>
  )
}
