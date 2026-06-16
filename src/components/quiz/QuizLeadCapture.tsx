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
}

export default function QuizLeadCapture({
  answers,
  score,
  batchRecommendation,
  leadSource,
  mode,
  onSuccess,
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
      setError('Email is required — enter a valid address.')
      return
    }
    if (!phone.trim()) {
      setError('Mobile number is required for your match report and callback.')
      return
    }
    if (!isValidIndianPhone(phone)) {
      setError('Enter a valid 10-digit Indian mobile number.')
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
            ? 'Email and mobile are required to unlock your cohort preview, batch fit breakdown, and a personal callback.'
            : 'Email and mobile are required — we’ll WhatsApp or call within 24h to help you pick dates and apply.'}
        </p>

        <form className="quiz-lead-form" onSubmit={handleSubmit} noValidate={false}>
          <label className="quiz-lead-field">
            <span className="quiz-lead-label">
              First name <span className="quiz-lead-req">*</span>
            </span>
            <input
              type="text"
              className="rfinput"
              placeholder="First name"
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </label>
          <label className="quiz-lead-field">
            <span className="quiz-lead-label">
              Email <span className="quiz-lead-req">*</span>
            </span>
            <input
              type="email"
              className="rfinput"
              placeholder="you@email.com"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </label>
          <label className="quiz-lead-field">
            <span className="quiz-lead-label">
              WhatsApp / mobile <span className="quiz-lead-req">*</span>
            </span>
            <input
              type="tel"
              className="rfinput"
              placeholder="10-digit mobile number"
              autoComplete="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              required
              minLength={10}
            />
          </label>

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
            Required fields. No spam — one human from Togetha to help you apply.
          </p>
        </form>
      </div>
    </div>
  )
}
