'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from '@/components/batches/DatePicker'
import GenderSelector from '@/components/batches/GenderSelector'
import RazorpayButton from '@/components/apply/RazorpayButton'
import { ROUTES } from '@/constants/routes'
import { formatPrice } from '@/lib/utils'
import '@/components/batches/batches.css'

interface ApplyFormProps {
  batchSlug: string
  batchName: string
  batchPrice: number
  dateOptions: { label: string; sublabel: string; soldOut?: boolean }[]
  accentColor: string
  roseAccent?: boolean
  initialName?: string
  initialEmail?: string
  applicantId?: string
}

export default function ApplyForm({
  batchSlug,
  batchName,
  batchPrice,
  dateOptions,
  accentColor,
  roseAccent,
  initialName = '',
  initialEmail = '',
  applicantId: initialApplicantId = '',
}: ApplyFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<'m' | 'f' | null>(null)
  const [dateChoice, setDateChoice] = useState<number | null>(0)
  const [applicantId, setApplicantId] = useState(initialApplicantId)
  const [orderId, setOrderId] = useState('')
  const [amount, setAmount] = useState(batchPrice * 100)
  const [keyId, setKeyId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const ensureApplicantId = async (): Promise<string | null> => {
    if (applicantId) return applicantId

    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        answers: {},
        score: 0,
        batchRecommendation: batchSlug,
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.applicantId) {
      throw new Error(data.error || 'Could not create your application profile.')
    }

    setApplicantId(data.applicantId)
    return data.applicantId as string
  }

  const handleStep1Next = async () => {
    setError('')

    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid phone number.')
      return
    }

    setIsLoading(true)
    try {
      await ensureApplicantId()
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2Next = async () => {
    setError('')

    if (!gender) {
      setError('Please select how you are joining.')
      return
    }
    if (dateChoice === null) {
      setError('Please select a departure date.')
      return
    }

    setIsLoading(true)
    try {
      const id = await ensureApplicantId()
      if (!id) throw new Error('Application profile not found.')

      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: id,
          name: name.trim(),
          phone: phone.trim(),
          gender,
          batchSlug,
          dateChoice,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Could not create payment order.')
      }

      setOrderId(data.orderId)
      setAmount(data.amount)
      if (data.keyId) setKeyId(data.keyId)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedDate =
    dateChoice !== null ? dateOptions[dateChoice] : null

  return (
    <div className="apply-card">
      <div className="apply-steps">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`apply-step${step === n ? ' active' : ''}${step > n ? ' done' : ''}`}
          >
            <span className="apply-step-num">{n}</span>
            <span className="apply-step-label">
              {n === 1 ? 'About you' : n === 2 ? 'Preferences' : 'Pay'}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <div className="apply-field">
            <label className="apply-label" htmlFor="apply-name">
              Full name
            </label>
            <input
              id="apply-name"
              type="text"
              className="apply-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={isLoading}
            />
          </div>
          <div className="apply-field">
            <label className="apply-label" htmlFor="apply-email">
              Email
            </label>
            <input
              id="apply-email"
              type="email"
              className="apply-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading}
            />
          </div>
          <div className="apply-field">
            <label className="apply-label" htmlFor="apply-phone">
              Phone (WhatsApp)
            </label>
            <input
              id="apply-phone"
              type="tel"
              className="apply-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              disabled={isLoading}
            />
          </div>
          <button
            type="button"
            className={`apply-submit${roseAccent ? ' rose' : ''}`}
            onClick={handleStep1Next}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue →'}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <GenderSelector
            value={gender}
            onChange={setGender}
            maleLabel={roseAccent ? '🧑 A man' : '🧑 A boy'}
            femaleLabel={roseAccent ? '👩 A woman' : '👧 A girl'}
          />
          <DatePicker
            options={dateOptions}
            value={dateChoice}
            onChange={setDateChoice}
            accentColor={accentColor}
          />
          <div className="apply-nav-row">
            <button
              type="button"
              className="apply-back"
              onClick={() => setStep(1)}
              disabled={isLoading}
            >
              ← Back
            </button>
            <button
              type="button"
              className={`apply-submit apply-continue${roseAccent ? ' rose' : ''}`}
              onClick={handleStep2Next}
              disabled={isLoading}
            >
              {isLoading ? 'Creating order...' : 'Review & Pay →'}
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="apply-review">
            <div className="apply-review-row">
              <span>Name</span>
              <strong>{name}</strong>
            </div>
            <div className="apply-review-row">
              <span>Email</span>
              <strong>{email}</strong>
            </div>
            <div className="apply-review-row">
              <span>Phone</span>
              <strong>{phone}</strong>
            </div>
            <div className="apply-review-row">
              <span>Batch</span>
              <strong>{batchName}</strong>
            </div>
            {selectedDate && (
              <div className="apply-review-row">
                <span>Date</span>
                <strong>{selectedDate.label}</strong>
              </div>
            )}
            <div className="apply-review-row apply-review-total">
              <span>Deposit due now</span>
              <strong>{formatPrice(amount / 100)}</strong>
            </div>
          </div>

          <RazorpayButton
            orderId={orderId}
            amount={amount}
            applicantId={applicantId}
            batchName={batchName}
            email={email}
            name={name}
            keyId={keyId}
            onSuccess={() => router.push(`${ROUTES.confirmation}?batch=${batchSlug}`)}
            onError={(msg) => setError(msg)}
          />

          <button
            type="button"
            className="apply-back apply-back-full"
            onClick={() => setStep(2)}
            disabled={isLoading}
          >
            ← Back
          </button>
        </>
      )}

      {error && (
        <p className="apply-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
