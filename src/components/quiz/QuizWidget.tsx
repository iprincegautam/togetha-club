'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QUIZ_QUESTIONS } from '@/constants/quiz'
import { ROUTES } from '@/constants/routes'
import { useQuiz } from '@/hooks/useQuiz'
import QuizResult from '@/components/quiz/QuizResult'

import type { QuizAnswers } from '@/types/quiz'

type Props = {
  onComplete?: (answers: QuizAnswers) => void
}

export default function QuizWidget({ onComplete }: Props) {
  const router = useRouter()
  const {
    cur,
    ans,
    phase,
    result,
    totalQuestions,
    pick,
    setRange,
    setText,
    goNext,
    goBack,
  } = useQuiz()

  const [fadeIn, setFadeIn] = useState(true)
  const resultRef = useRef<HTMLDivElement>(null)

  const question = QUIZ_QUESTIONS[cur]
  const pct = Math.round(((cur + 1) / totalQuestions) * 100)
  const isLast = cur === totalQuestions - 1

  useEffect(() => {
    setFadeIn(false)
    const t = setTimeout(() => setFadeIn(true), 10)
    return () => clearTimeout(t)
  }, [cur])

  useEffect(() => {
    if (phase === 'result') {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      onComplete?.(ans)
    }
  }, [phase, ans, onComplete])

  const handleSubmit = async (name: string, email: string) => {
    if (!result) return

    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        answers: ans,
        score: result.score,
        batchRecommendation: result.batchRecommendation,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Something went wrong. Please try again.')
    }

    router.push(ROUTES.apply(result.batchRecommendation))
  }

  return (
    <div className="qc" ref={resultRef}>
      {phase === 'quiz' && (
        <>
          <div className="qprog">
            <div className="prog-hdr">
              <span className="prog-lbl">
                Question {cur + 1} of {totalQuestions}
              </span>
              <span className="prog-lbl">{pct}%</span>
            </div>
            <div className="prog-track">
              <div className="prog-bar" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div
            className="qarea"
            style={{
              opacity: fadeIn ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
          >
            <div className="qnum">
              Question {cur + 1} of {totalQuestions}
            </div>
            <div className="qtext">{question.q}</div>
            {question.sub && <div className="qsub">{question.sub}</div>}

            {question.type === 'opts' && question.opts && (
              <div className="qopts">
                {question.opts.map((opt, i) => {
                  const selected = ans[question.id] === i
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`qopt${selected ? ' selected' : ''}`.trim()}
                      onClick={() => pick(question.id, i)}
                    >
                      {selected && <span className="qopt-star">✦ </span>}
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}

            {question.type === 'range' && (
              <>
                <div className="qrange-val">{ans[question.id] ?? 7}</div>
                <input
                  type="range"
                  className="qrange"
                  min={1}
                  max={10}
                  value={(ans[question.id] as number) ?? 7}
                  onChange={(e) => setRange(question.id, parseInt(e.target.value, 10))}
                />
                <div className="qrange-lbls">
                  <span>{question.min}</span>
                  <span>{question.max}</span>
                </div>
              </>
            )}

            {question.type === 'text' && (
              <textarea
                className="qinput"
                rows={4}
                placeholder={question.ph}
                value={(ans[question.id] as string) ?? ''}
                onChange={(e) => setText(question.id, e.target.value)}
              />
            )}
          </div>

          <div className="qnav">
            <button
              type="button"
              className="qback"
              onClick={goBack}
              style={{ visibility: cur > 0 ? 'visible' : 'hidden' }}
            >
              ← Back
            </button>
            <button type="button" className="qnext" onClick={goNext}>
              {isLast ? 'See My Result →' : 'Next →'}
            </button>
          </div>
        </>
      )}

      {phase === 'result' && result && (
        <QuizResult result={result} answers={ans} onSubmit={handleSubmit} />
      )}
    </div>
  )
}
