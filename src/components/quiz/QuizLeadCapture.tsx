'use client'

import { useState } from 'react'
import { BATCH_AGE_LIMITS } from '@/lib/batch-age'
import { formatIndianPhoneDisplay, isValidIndianPhone, normalizeIndianPhone } from '@/lib/phone'
import { saveQuizLead } from '@/lib/quiz-lead-storage'
import { submitQuizLead, type QuizLeadSource } from '@/lib/quiz-lead'
import type { QuizAnswers } from '@/types/quiz'

const BATCH_LABELS: Record<string, string> = {
  'batch-a': 'GenZ Edition (Batch A)',
  'batch-b': 'Millennial Edition (Batch B)',
}

type Props = {
  answers: QuizAnswers
  score: number
  batchRecommendation: string
  leadSource: QuizLeadSource
  mode: 'gate' | 'inline'
  onSuccess: (applicantId: string) => void
  onSkip?: () => void
}

export default function QuizLeadCapture({
  answers,
  score,
  batchRecommendation,
  leadSource,
  mode,
  onSuccess,
  onSkip,
}: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const batchLabel = BATCH_LABELS[batchRecommendation] ?? 'your best-fit batch'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter your first name.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email.')
      return
    }
    if (!isValidIndianPhone(phone)) {
      setError('Enter a valid 10-digit Indian mobile number (for WhatsApp or a quick call).')
      return
    }

    const normalizedPhone = normalizeIndianPhone(phone)

    setLoading(true)
    try {
      const { applicantId } = await submitQuizLead({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        answers,
        score,
        batchRecommendation,
        leadSource,
        wantsCallback: true,
      })

      saveQuizLead({
        applicantId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        phone: normalizedPhone,
        savedAt: new Date().toISOString(),
      })

      setSuccess(true)
      onSuccess(applicantId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success && mode === 'inline') {
    return (
      <div className="quiz-lead quiz-lead--success">
        <p className="quiz-lead-success">
          ✓ Saved — our team will reach out within 24 hours on {formatIndianPhoneDisplay(phone)}.
        </p>
      </div>
    )
  }

  return (
    <div className={`quiz-lead${mode === 'gate' ? ' quiz-lead--gate' : ''}`}>
      {mode === 'gate' && (
        <div className="quiz-lead-teaser">
          <p className="quiz-lead-eyebrow">✦ Match report ready</p>
          <div className="quiz-lead-score">{score}%</div>
          <p className="quiz-lead-score-lbl">AI compatibility score</p>
          <p className="quiz-lead-teaser-copy">
            Strong fit for <strong>{batchLabel}</strong> · ages{' '}
            {batchRecommendation === 'batch-b'
              ? BATCH_AGE_LIMITS['batch-b'].label
              : BATCH_AGE_LIMITS['batch-a'].label}
          </p>
        </div>
      )}

      <div className="quiz-lead-card">
        <h3 className="quiz-lead-title">
          {mode === 'gate' ? 'See your full match report' : 'Get a priority callback'}
        </h3>
        <p className="quiz-lead-sub">
          {mode === 'gate'
            ? 'Save your results and unlock cohort preview, batch fit breakdown, and a personal call to help you book.'
            : 'Share your details — we’ll WhatsApp or call within 24h to help you pick dates and apply.'}
        </p>

        <form className="quiz-lead-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="rfinput"
            placeholder="First name"
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          <input
            type="email"
            className="rfinput"
            placeholder="Email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="tel"
            className="rfinput"
            placeholder="WhatsApp / mobile (10 digits)"
            autoComplete="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />

          {error && (
            <p className="quiz-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="rfbtn" disabled={loading}>
            {loading
              ? 'Saving…'
              : mode === 'gate'
                ? 'Unlock my match report →'
                : 'Save & request callback →'}
          </button>

          <p className="quiz-lead-fine">
            No spam. One human from Togetha — to answer questions and help you apply.
          </p>
        </form>

        {mode === 'gate' && onSkip && (
          <button type="button" className="quiz-lead-skip" onClick={onSkip} disabled={loading}>
            Continue without saving
          </button>
        )}
      </div>
    </div>
  )
}
