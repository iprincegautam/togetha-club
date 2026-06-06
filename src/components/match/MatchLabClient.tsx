'use client'

import { useEffect, useState } from 'react'
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

export default function MatchLabClient({ initialBatch }: Props) {
  const [answers, setAnswers] = useState<QuizAnswers | null>(null)
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)

  useEffect(() => {
    setAnswers(loadQuizAnswers())
  }, [])

  useEffect(() => {
    if (!answers) {
      setAnalysis(null)
      return
    }

    fetch('/api/match/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, includeNarrative: true }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.analysis) {
          setAnalysis(json.analysis)
          return
        }
        setAnalysis(analyzeMatchProfile(answers))
      })
      .catch(() => setAnalysis(analyzeMatchProfile(answers)))
  }, [answers])

  const retakeQuiz = () => {
    clearQuizAnswers()
    setAnswers(null)
    setAnalysis(null)
  }

  if (!analysis || !answers) {
    return (
      <div className="match-lab">
        {initialBatch && (
          <p className="match-lab-note match-lab-note-top">
            You opened this from {BATCH_META[initialBatch].label}. Complete the quiz and we&apos;ll
            pre-select that batch in your preview.
          </p>
        )}
        <QuizSection onComplete={(saved) => setAnswers(saved)} />
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
