'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BATCH_AGE_LIMITS,
  isValidQuizAge,
  parseQuizAge,
  primaryBatchForAge,
  QUIZ_DEPARTURE_QUESTION_ID,
} from '@/lib/batch-age'
import { QUIZ_QUESTIONS } from '@/constants/quiz'
import { loadQuizAnswers } from '@/lib/quiz-storage'
import { useQuiz } from '@/hooks/useQuiz'
import QuizResult from '@/components/quiz/QuizResult'
import type { DateOption } from '@/lib/batches'
import type { MatchableBatchSlug } from '@/types/match'

import type { QuizAnswers } from '@/types/quiz'

type Props = {
  onComplete?: (answers: QuizAnswers) => void
  /** When true, hand off to parent after scoring — do not render inline QuizResult. */
  delegateResults?: boolean
}

export default function QuizWidget({ onComplete, delegateResults = false }: Props) {
  const {
    cur,
    ans,
    phase,
    result,
    totalQuestions,
    pick,
    setRange,
    setText,
    setAge,
    goNext,
    goBack,
  } = useQuiz()

  const [fadeIn, setFadeIn] = useState(true)
  const [quizError, setQuizError] = useState('')
  const [departureDates, setDepartureDates] = useState<DateOption[]>([])
  const [departureLoading, setDepartureLoading] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const completionNotifiedRef = useRef(false)

  const question = QUIZ_QUESTIONS[cur]
  const pct = Math.round(((cur + 1) / totalQuestions) * 100)
  const isLast = cur === totalQuestions - 1
  const ageForDepartures = parseQuizAge(ans)

  useEffect(() => {
    setFadeIn(false)
    const t = setTimeout(() => setFadeIn(true), 10)
    return () => clearTimeout(t)
  }, [cur])

  useEffect(() => {
    if (phase !== 'quiz' || question?.type !== 'departure') return

    const batchSlug: MatchableBatchSlug =
      ageForDepartures !== null && primaryBatchForAge(ageForDepartures)
        ? primaryBatchForAge(ageForDepartures)!
        : 'batch-a'

    let cancelled = false
    setDepartureLoading(true)

    fetch(`/api/batches/${batchSlug}/departures`)
      .then((r) => r.json())
      .then((json: { dates?: DateOption[] }) => {
        if (cancelled) return
        setDepartureDates(json.dates ?? [])
      })
      .catch(() => {
        if (!cancelled) setDepartureDates([])
      })
      .finally(() => {
        if (!cancelled) setDepartureLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [phase, question?.type, ageForDepartures, cur])

  useEffect(() => {
    if (phase !== 'result' || !result || completionNotifiedRef.current) return

    completionNotifiedRef.current = true

    if (delegateResults) {
      onComplete?.(loadQuizAnswers() ?? ans)
      return
    }

    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    onComplete?.(ans)
  }, [phase, result, ans, onComplete, delegateResults])

  const handleNext = () => {
    setQuizError('')
    if (question.type === 'age') {
      const age = parseInt(String(ans[question.id] ?? ''), 10)
      if (!isValidQuizAge(age)) {
        setQuizError('Enter your age (18 or above) to continue.')
        return
      }
    }
    if (question.type === 'departure') {
      const choice = ans[QUIZ_DEPARTURE_QUESTION_ID]
      if (choice === undefined || choice === '') {
        setQuizError('Pick a departure date to continue.')
        return
      }
    }
    goNext()
  }

  const pickDeparture = (label: string) => {
    setText(QUIZ_DEPARTURE_QUESTION_ID, label)
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

            {question.type === 'departure' && (
              <div className="qopts">
                {departureLoading && <p className="qsub">Loading departure dates…</p>}
                {!departureLoading &&
                  departureDates.map((opt) => {
                    const selected = ans[question.id] === opt.label
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        className={`qopt${selected ? ' selected' : ''}`.trim()}
                        onClick={() => pickDeparture(opt.label)}
                        disabled={opt.soldOut}
                      >
                        {selected && <span className="qopt-star">✦ </span>}
                        <span className="qopt-date-label">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="qopt-date-sub">{opt.sublabel}</span>
                        )}
                      </button>
                    )
                  })}
                {!departureLoading && departureDates.length === 0 && (
                  <p className="qsub">No departures in the next 6 weeks — check back soon.</p>
                )}
              </div>
            )}

            {question.type === 'age' && (
              <div className="qage-wrap">
                <input
                  id="quiz-age"
                  type="text"
                  inputMode="numeric"
                  className="qinput qage-input"
                  placeholder={question.ph}
                  value={String(ans[question.id] ?? '')}
                  onChange={(e) => setAge(question.id, e.target.value)}
                />
                <p className="qage-hint">
                  GenZ Edition · ages {BATCH_AGE_LIMITS['batch-a'].label} · Millennial Edition · ages{' '}
                  {BATCH_AGE_LIMITS['batch-b'].label}
                </p>
              </div>
            )}

            {quizError && (
              <p className="quiz-error" role="alert">
                {quizError}
              </p>
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
            <button type="button" className="qnext" onClick={handleNext}>
              {isLast ? 'See My Result →' : 'Next →'}
            </button>
          </div>
        </>
      )}

      {phase === 'result' && result && !delegateResults && (
        <QuizResult result={result} answers={ans} />
      )}

      {phase === 'result' && delegateResults && (
        <p className="match-live-loading">Calculating your match preview…</p>
      )}
    </div>
  )
}
