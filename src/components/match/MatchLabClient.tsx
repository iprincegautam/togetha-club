'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import QuizSection from '@/components/home/QuizSection'
import MatchPreviewPanel from '@/components/match/MatchPreviewPanel'
import CohortTeaserPanel from '@/components/match/CohortTeaserPanel'
import { BATCH_META } from '@/constants/batches'
import { analyzeMatchProfile } from '@/lib/match-engine'
import { clearQuizAnswers, loadQuizAnswers } from '@/lib/quiz-storage'
import type { MatchAnalysis, MatchableBatchSlug } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

type Props = {
  initialBatch?: MatchableBatchSlug
}

type MatchLabMode = 'quiz' | 'results'

export default function MatchLabClient({ initialBatch }: Props) {
  const searchParams = useSearchParams()
  const [booted, setBooted] = useState(false)
  const [mode, setMode] = useState<MatchLabMode>('quiz')
  const [quizKey, setQuizKey] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers | null>(null)
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)

  useEffect(() => {
    const wantsRetake = searchParams.get('retake') === '1'

    if (wantsRetake) {
      clearQuizAnswers()
      setAnswers(null)
      setAnalysis(null)
      setMode('quiz')
      setQuizKey((key) => key + 1)
      setBooted(true)
      return
    }

    const stored = loadQuizAnswers()
    if (stored) {
      setAnswers(stored)
      setMode('results')
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
      body: JSON.stringify({ answers, includeNarrative: true }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json) => {
        if (controller.signal.aborted) return
        if (json.analysis) {
          setAnalysis(json.analysis)
          return
        }
        setAnalysis(analyzeMatchProfile(answers))
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === 'AbortError') return
        setAnalysis(analyzeMatchProfile(answers))
      })

    return () => controller.abort()
  }, [answers, mode])

  const retakeQuiz = useCallback(() => {
    clearQuizAnswers()
    setAnswers(null)
    setAnalysis(null)
    setMode('quiz')
    setQuizKey((key) => key + 1)
  }, [])

  const handleQuizComplete = useCallback((saved: QuizAnswers) => {
    setAnswers(saved)
    setAnalysis(null)
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
        {initialBatch && (
          <p className="match-lab-note match-lab-note-top">
            You opened this from {BATCH_META[initialBatch].label}. Complete the quiz and we&apos;ll
            pre-select that batch in your preview.
          </p>
        )}
        <QuizSection
          key={quizKey}
          delegateResults
          onComplete={handleQuizComplete}
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
        <h1 className="match-lab-title">Your batch compatibility preview</h1>
        <p className="match-lab-sub">
          Switch batches to compare fit. Scores blend your quiz profile with real applicant data already
          in each batch pipeline.
        </p>
        <button type="button" className="match-secondary-link" onClick={retakeQuiz}>
          Retake the quiz →
        </button>
      </div>
      <CohortTeaserPanel
        answers={answers}
        batchMatches={analysis.batches}
        initialBatch={initialBatch}
      />
      <MatchPreviewPanel
        answers={answers}
        batchMatches={analysis.batches}
        initialBatch={initialBatch}
        showApplyLink
        fetchLive={false}
      />
    </div>
  )
}
