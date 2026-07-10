'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import GenderSelector from '@/components/batches/GenderSelector'
import DatePicker from '@/components/batches/DatePicker'
import QuizWidget from '@/components/quiz/QuizWidget'
import { BATCH_META } from '@/constants/batches'
import { ROUTES } from '@/constants/routes'
import { BOOKABLE_BATCH_SLUGS, getDestinationForBatch } from '@/constants/destinations'
import { primaryBatchForAge, parseQuizAge } from '@/lib/batch-age'
import type { MatchableBatchSlug } from '@/types/match'
import type { DateOption } from '@/lib/batches'
import { calculateQuizResult } from '@/lib/utils'
import type { QuizAnswers, QuizResult } from '@/types/quiz'

type Step = 'quiz' | 'booking'

export default function MemberCompleteProfileFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('quiz')
  const [answers, setAnswers] = useState<QuizAnswers | null>(null)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [batchSlug, setBatchSlug] = useState<MatchableBatchSlug>('batch-a')
  const [gender, setGender] = useState<'m' | 'f' | null>(null)
  const [dateChoice, setDateChoice] = useState<number | null>(null)
  const [dateOptions, setDateOptions] = useState<DateOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (step !== 'booking') return
    fetch(`/api/batches/${batchSlug}/departures`)
      .then((r) => r.json())
      .then((json: { dates?: DateOption[] }) => setDateOptions(json.dates ?? []))
      .catch(() => setDateOptions([]))
  }, [batchSlug, step])

  const handleQuizComplete = (completedAnswers: QuizAnswers) => {
    const destination = getDestinationForBatch(batchSlug) ?? 'himalayan'
    const computed = calculateQuizResult(completedAnswers, destination)
    setAnswers(completedAnswers)
    setQuizResult(computed)
    const age = parseQuizAge(completedAnswers)
    const recommended = age !== null ? primaryBatchForAge(age, destination) : null
    if (recommended) {
      setBatchSlug(recommended)
    }
    setStep('booking')
  }

  const handleSubmit = async () => {
    setError(null)
    if (!answers || !quizResult) {
      setError('Complete the quiz first.')
      return
    }
    if (!gender) {
      setError('Select how you are joining the trip.')
      return
    }
    if (dateChoice === null) {
      setError('Choose a departure date.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/account/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers,
        score: quizResult.score,
        batchSlug,
        gender,
        dateChoice: String(dateChoice),
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Could not save profile')
      setLoading(false)
      return
    }

    router.push(ROUTES.account)
    router.refresh()
  }

  if (step === 'quiz') {
    return (
      <div className="account-stack">
        <div className="account-panel">
          <p className="apply-eyebrow">✦ Unlocked ✦</p>
          <h1 className="account-title">Complete your profile</h1>
          <p className="account-sub">
            Payment confirmed — take the compatibility quiz, then choose your batch and departure.
          </p>
        </div>
        <div className="account-panel">
          <QuizWidget delegateResults onComplete={handleQuizComplete} />
        </div>
      </div>
    )
  }

  const batchMeta = BATCH_META[batchSlug]

  return (
    <div className="account-stack">
      <div className="account-panel">
        <p className="apply-eyebrow">✦ Almost done ✦</p>
        <h1 className="account-title">Choose your trip</h1>
        <p className="account-sub">
          Quiz score: {quizResult?.score ?? '—'}. Pick your batch and departure to finish your
          profile.
        </p>
      </div>

      <div className="account-panel apply-card">
        <div className="apply-field">
          <span className="apply-label">Batch</span>
          <div className="gender-options">
            {BOOKABLE_BATCH_SLUGS.map((slug) => (
              <button
                key={slug}
                type="button"
                className={`gender-btn${batchSlug === slug ? ' active-m' : ''}`}
                onClick={() => {
                  setBatchSlug(slug)
                  setDateChoice(null)
                }}
              >
                {BATCH_META[slug].label}
              </button>
            ))}
          </div>
          <p className="account-muted" style={{ marginTop: 8 }}>
            {batchMeta.tagline} · Ages {batchMeta.ageRange}
          </p>
        </div>

        <GenderSelector value={gender} onChange={setGender} maleLabel="A man" femaleLabel="A woman" />

        <DatePicker
          options={dateOptions}
          value={dateChoice}
          onChange={setDateChoice}
          accentColor={batchMeta.accentColor}
        />

        {error && (
          <p className="apply-error" role="alert">
            {error}
          </p>
        )}

        <button type="button" className="apply-submit" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Saving…' : 'Save & complete profile →'}
        </button>
      </div>
    </div>
  )
}
