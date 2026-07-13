'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import QuizSection from '@/components/home/QuizSection'
import QuizLeadCapture from '@/components/quiz/QuizLeadCapture'
import CohortTeaserPanel from '@/components/match/CohortTeaserPanel'
import MatchPreviewPanel from '@/components/match/MatchPreviewPanel'
import { BATCH_META } from '@/constants/batches'
import { DESTINATIONS, getDestinationForBatch, isDestinationSlug, type DestinationSlug } from '@/constants/destinations'
import { readQuizDestination } from '@/lib/batch-age'
import { analyzeMatchProfile } from '@/lib/match-engine'
import { clearQuizAnswers, loadQuizAnswers } from '@/lib/quiz-storage'
import { clearQuizLead, hasCompletedQuizLead, loadQuizLead } from '@/lib/quiz-lead-storage'
import { ensureNurtureEmail } from '@/lib/quiz-lead'
import { trackMatchResultShown } from '@/lib/meta-pixel'
import { calculateQuizResult } from '@/lib/utils'
import type { MatchAnalysis, MatchableBatchSlug } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

type Props = {
  initialBatch?: MatchableBatchSlug
  initialDestination?: DestinationSlug
}

type MatchLabMode = 'quiz' | 'lead' | 'results'

export default function MatchLabClient({ initialBatch, initialDestination }: Props) {
  const searchParams = useSearchParams()
  const [booted, setBooted] = useState(false)
  const [mode, setMode] = useState<MatchLabMode>('quiz')
  const [quizKey, setQuizKey] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers | null>(null)
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)
  const matchResultTrackedRef = useRef(false)

  // The trail we can pre-select on the quiz when the visitor arrives from a
  // destination/batch link. Undefined means "let them choose".
  const preselectDestination: DestinationSlug | undefined =
    initialDestination ??
    (isDestinationSlug(searchParams.get('destination') ?? '')
      ? (searchParams.get('destination') as DestinationSlug)
      : getDestinationForBatch(initialBatch ?? '') ?? undefined)

  // The trail the visitor actually picked in the quiz wins; otherwise fall back
  // to the link they came from, then to Himalayan.
  const destination: DestinationSlug =
    (answers ? readQuizDestination(answers) : null) ?? preselectDestination ?? 'himalayan'

  // Only honour an incoming ?batch= pre-selection when it matches the chosen trail.
  const effectiveInitialBatch =
    initialBatch && getDestinationForBatch(initialBatch) === destination ? initialBatch : undefined

  const quizResult = useMemo(
    () => (answers ? calculateQuizResult(answers, destination) : null),
    [answers, destination]
  )

  useEffect(() => {
    const wantsRetake = searchParams.get('retake') === '1'

    if (wantsRetake) {
      clearQuizAnswers()
      clearQuizLead()
      setAnswers(null)
      setAnalysis(null)
      matchResultTrackedRef.current = false
      setMode('quiz')
      setQuizKey((key) => key + 1)
      setBooted(true)
      return
    }

    const stored = loadQuizAnswers()
    if (stored) {
      setAnswers(stored)
      setMode(hasCompletedQuizLead() ? 'results' : 'lead')
    } else {
      setMode('quiz')
    }

    setBooted(true)
  }, [searchParams])

  useEffect(() => {
    if (mode !== 'results' || !answers) {
      setAnalysis(null)
      return
    }

    const controller = new AbortController()

    fetch('/api/match/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, includeNarrative: true, destination }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json) => {
        if (controller.signal.aborted) return
        if (json.analysis) {
          setAnalysis(json.analysis)
          return
        }
        setAnalysis(analyzeMatchProfile(answers, destination))
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === 'AbortError') return
        setAnalysis(analyzeMatchProfile(answers, destination))
      })

    return () => controller.abort()
  }, [answers, destination, mode])

  const retakeQuiz = useCallback(() => {
    clearQuizAnswers()
    clearQuizLead()
    setAnswers(null)
    setAnalysis(null)
    matchResultTrackedRef.current = false
    setMode('quiz')
    setQuizKey((key) => key + 1)
  }, [])

  useEffect(() => {
    if (mode !== 'results' || !answers || !analysis || matchResultTrackedRef.current) return
    matchResultTrackedRef.current = true
    trackMatchResultShown()
  }, [mode, answers, analysis])

  const handleQuizComplete = useCallback((saved: QuizAnswers) => {
    setAnswers(saved)
    setAnalysis(null)
    setMode('lead')
  }, [])

  useEffect(() => {
    if (mode !== 'results') return
    const lead = loadQuizLead()
    if (!lead?.applicantId) return
    ensureNurtureEmail(lead.applicantId).catch((err) =>
      console.warn('[MatchLab] nurture backup failed', err)
    )
  }, [mode])

  const unlockResults = useCallback(() => {
    setMode('results')
  }, [])

  if (!booted) {
    return (
      <div className="match-lab">
        <p className="match-live-loading">Loading your match lab…</p>
      </div>
    )
  }

  if (mode === 'quiz') {
    return (
      <div className="match-lab">
        {(initialBatch || initialDestination) && (
          <p className="match-lab-note match-lab-note-top">
            {initialBatch
              ? `You opened this from ${BATCH_META[initialBatch].label}. Complete the quiz and we'll pre-select that edition in your preview.`
              : `You opened this for ${DESTINATIONS[destination].title}. Complete the quiz and we'll compare GenZ vs Millennial editions.`}
          </p>
        )}
        <QuizSection
          key={quizKey}
          delegateResults
          destination={destination}
          preselectDestination={preselectDestination}
          onComplete={handleQuizComplete}
        />
      </div>
    )
  }

  if (mode === 'lead' && answers && quizResult) {
    return (
      <div className="match-lab">
        <QuizLeadCapture
          answers={answers}
          score={quizResult.score}
          batchRecommendation={quizResult.batchRecommendation}
          leadSource="quiz_match_lab"
          mode="gate"
          onSuccess={unlockResults}
        />
      </div>
    )
  }

  if (!answers || !analysis) {
    return (
      <div className="match-lab">
        <p className="match-live-loading">Calculating your match preview…</p>
      </div>
    )
  }

  return (
    <div className="match-lab">
      <div className="match-lab-intro">
        <p className="match-preview-eyebrow">✦ AI Match Lab</p>
        <h1 className="match-lab-title">Your {DESTINATIONS[destination].shortTitle} compatibility preview</h1>
        <p className="match-lab-sub">
          Switch editions to compare fit. Scores blend your quiz profile with real applicant data already
          in each batch pipeline.
        </p>
        <button type="button" className="match-secondary-link" onClick={retakeQuiz}>
          Retake the quiz →
        </button>
      </div>
      <CohortTeaserPanel
        answers={answers}
        batchMatches={analysis.batches}
        initialBatch={effectiveInitialBatch}
        destination={destination}
      />
      <MatchPreviewPanel
        answers={answers}
        batchMatches={analysis.batches}
        initialBatch={effectiveInitialBatch}
        showApplyLink
        fetchLive={false}
      />
    </div>
  )
}
