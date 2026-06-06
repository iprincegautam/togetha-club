'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QuizWidget from '@/components/quiz/QuizWidget'
import MatchPreviewPanel from '@/components/match/MatchPreviewPanel'
import { BATCH_META } from '@/constants/batches'
import { ROUTES } from '@/constants/routes'
import { analyzeMatchProfile } from '@/lib/match-engine'
import { loadQuizAnswers } from '@/lib/quiz-storage'
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

  if (!analysis || !answers) {
    return (
      <div className="match-lab">
        <div className="match-lab-intro">
          <p className="match-preview-eyebrow">✦ AI Match Lab</p>
          <h1 className="match-lab-title">
            See your chances on <span className="t">any batch.</span>
          </h1>
          <p className="match-lab-sub">
            Take the 10-question compatibility quiz, then switch between Batch A and Batch B to preview
            your match score, placement likelihood, cohort overlap, and the personality mix you&apos;re
            most likely to connect with.
          </p>
          {initialBatch && (
            <p className="match-lab-note">
              You opened this from {BATCH_META[initialBatch].label}. Complete the quiz and we&apos;ll
              pre-select that batch in your preview.
            </p>
          )}
        </div>
        <QuizWidget onComplete={(saved) => setAnswers(saved)} />
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
        <Link href={`${ROUTES.home}#quiz`} className="match-secondary-link">
          Retake the quiz →
        </Link>
      </div>
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
