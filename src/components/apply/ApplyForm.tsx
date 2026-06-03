'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from '@/components/batches/DatePicker'
import GenderSelector from '@/components/batches/GenderSelector'
import RazorpayButton from '@/components/apply/RazorpayButton'
import { ROUTES } from '@/constants/routes'
import { formatPrice } from '@/lib/utils'
import '@/components/batches/batches.css'

interface PromoPreview {
  code: string
  discountAmount: number
  finalAmount: number
  originalAmount: number
  grantsPriority: boolean
  message: string
}

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
  initialPromoCode?: string
  previewStep?: 2 | 3
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
  initialPromoCode = '',
  previewStep,
}: ApplyFormProps) {
  const router = useRouter()
  const isPreview = Boolean(previewStep)
  const previewOriginal = batchPrice * 100
  const previewDiscount = 200000
  const previewPromoDefault: PromoPreview | null = previewStep
    ? {
        code: initialPromoCode || 'SARAH200',
        discountAmount: previewDiscount,
        finalAmount: previewOriginal - previewDiscount,
        originalAmount: previewOriginal,
        grantsPriority: true,
        message: 'You save ₹2,000!',
      }
    : null

  const [step, setStep] = useState<1 | 2 | 3>(previewStep ?? 1)
  const [name, setName] = useState(initialName || (isPreview ? 'Preview User' : ''))
  const [email, setEmail] = useState(initialEmail || (isPreview ? 'preview@togetha.club' : ''))
  const [phone, setPhone] = useState(isPreview ? '9876543210' : '')
  const [gender, setGender] = useState<'m' | 'f' | null>(isPreview ? 'm' : null)
  const [dateChoice, setDateChoice] = useState<number | null>(0)
  const [applicantId, setApplicantId] = useState(
    initialApplicantId || (isPreview ? 'preview-applicant-id' : '')
  )
  const [orderId, setOrderId] = useState(isPreview && previewStep === 3 ? 'dev_order_preview' : '')
  const [amount, setAmount] = useState(
    isPreview && previewStep === 3 ? previewOriginal - previewDiscount : batchPrice * 100
  )
  const [originalAmount, setOriginalAmount] = useState(
    isPreview && previewStep === 3 ? previewOriginal : batchPrice * 100
  )
  const [discountAmount, setDiscountAmount] = useState(
    isPreview && previewStep === 3 ? previewDiscount : 0
  )
  const [keyId, setKeyId] = useState('')
  const [promoInput, setPromoInput] = useState(initialPromoCode || (isPreview ? 'SARAH200' : ''))
  const [appliedPromo, setAppliedPromo] = useState<PromoPreview | null>(previewPromoDefault)
  const [promoError, setPromoError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const validatePromo = useCallback(
    async (code: string): Promise<PromoPreview | null> => {
      setPromoError('')
      if (!code.trim()) {
        setAppliedPromo(null)
        return null
      }

      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          batchSlug,
          originalAmount: batchPrice * 100,
        }),
      })

      const data = await res.json()

      if (!data.valid) {
        setAppliedPromo(null)
        setPromoError(data.error || 'Invalid promo code.')
        return null
      }

      const promo: PromoPreview = {
        code: data.code,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
        originalAmount: data.originalAmount,
        grantsPriority: data.grantsPriority,
        message: data.message,
      }
      setAppliedPromo(promo)
      return promo
    },
    [batchSlug, batchPrice]
  )

  useEffect(() => {
    if (initialPromoCode && !isPreview) {
      validatePromo(initialPromoCode)
    }
  }, [initialPromoCode, validatePromo, isPreview])

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

  const handleApplyPromo = async () => {
    setIsLoading(true)
    try {
      await validatePromo(promoInput)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2Next = async () => {
    setError('')
    setPromoError('')

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
      let promo = appliedPromo
      if (promoInput.trim() && !promo) {
        promo = await validatePromo(promoInput)
        if (!promo) return
      }

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
          promoCode: promo?.code ?? undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Could not create payment order.')
      }

      setOrderId(data.orderId)
      setAmount(data.amount)
      setOriginalAmount(data.originalAmount ?? batchPrice * 100)
      setDiscountAmount(data.discountAmount ?? 0)
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

          <div className="apply-field apply-promo-field">
            <label className="apply-label" htmlFor="apply-promo">
              Promo code (optional)
            </label>
            <div className="apply-promo-row">
              <input
                id="apply-promo"
                type="text"
                className="apply-input apply-promo-input"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase())
                  setAppliedPromo(null)
                  setPromoError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (promoInput.trim() && !isLoading) {
                      handleApplyPromo()
                    }
                  }
                }}
                placeholder="e.g. SARAH200"
                disabled={isLoading}
              />
              <button
                type="button"
                className={`apply-promo-btn${roseAccent ? ' rose' : ''}`}
                onClick={handleApplyPromo}
                disabled={isLoading || !promoInput.trim()}
              >
                Apply
              </button>
            </div>
            {appliedPromo && (
              <p className="apply-promo-success">
                ✓ {appliedPromo.message}
                {appliedPromo.grantsPriority && ' · Priority review included'}
              </p>
            )}
            {promoError && (
              <p className="apply-promo-error" role="alert">
                {promoError}
              </p>
            )}
          </div>

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
            {appliedPromo && (
              <div className="apply-review-row">
                <span>Promo</span>
                <strong>{appliedPromo.code}</strong>
              </div>
            )}
            {discountAmount > 0 && (
              <>
                <div className="apply-review-row">
                  <span>Original price</span>
                  <strong>{formatPrice(originalAmount / 100)}</strong>
                </div>
                <div className="apply-review-row apply-review-discount">
                  <span>Discount</span>
                  <strong>−{formatPrice(discountAmount / 100)}</strong>
                </div>
              </>
            )}
            <div className="apply-review-row apply-review-total">
              <span>Amount due now</span>
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
