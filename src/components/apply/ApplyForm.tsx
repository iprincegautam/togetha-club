'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from '@/components/batches/DatePicker'
import GenderSelector from '@/components/batches/GenderSelector'
import RazorpayButton from '@/components/apply/RazorpayButton'
import { ROUTES } from '@/constants/routes'
import { readDepartureFromQuiz } from '@/lib/nurture/departure'
import {
  calculatePaymentAmounts,
  depositAmountForTotal,
  DEPOSIT_PERCENT,
  type PaymentPlan,
} from '@/lib/payment-plan'
import { calculateQuizResult, formatPaise } from '@/lib/utils'
import { getDestinationForBatch } from '@/constants/destinations'
import { normalizeIndianPhone } from '@/lib/phone'
import { loadQuizLead } from '@/lib/quiz-lead-storage'
import { loadQuizAnswers } from '@/lib/quiz-storage'
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
  initialDateIndex?: number
}

function resolveInitialDateChoice(
  dateOptions: { label: string }[],
  initialDateIndex?: number
): number | null {
  if (
    initialDateIndex != null &&
    initialDateIndex >= 0 &&
    initialDateIndex < dateOptions.length
  ) {
    return initialDateIndex
  }

  const answers = loadQuizAnswers()
  if (answers) {
    const { label } = readDepartureFromQuiz(answers)
    if (label) {
      const idx = dateOptions.findIndex((option) => option.label === label)
      if (idx >= 0) return idx
    }
  }

  return dateOptions.length ? 0 : null
}

function isCompleteQuizLead(lead: NonNullable<ReturnType<typeof loadQuizLead>>): boolean {
  return Boolean(
    lead.applicantId &&
      lead.name?.trim() &&
      lead.email?.includes('@') &&
      lead.phone?.trim()
  )
}

function readSavedLead(isPreview: boolean) {
  if (isPreview || typeof window === 'undefined') return null
  return loadQuizLead()
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
  initialDateIndex,
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

  const [step, setStep] = useState<1 | 2 | 3>(() => previewStep ?? 1)
  const [name, setName] = useState(() => {
    const lead = readSavedLead(isPreview)
    return initialName || lead?.name || (isPreview ? 'Preview User' : '')
  })
  const [email, setEmail] = useState(() => {
    const lead = readSavedLead(isPreview)
    return initialEmail || lead?.email || (isPreview ? 'preview@togetha.club' : '')
  })
  const [phone, setPhone] = useState(() => {
    const lead = readSavedLead(isPreview)
    return lead?.phone || (isPreview ? '9876543210' : '')
  })
  const [gender, setGender] = useState<'m' | 'f' | null>(isPreview ? 'm' : null)
  const [dateChoice, setDateChoice] = useState<number | null>(() =>
    resolveInitialDateChoice(dateOptions, initialDateIndex)
  )
  const [applicantId, setApplicantId] = useState(() => {
    const lead = readSavedLead(isPreview)
    return initialApplicantId || lead?.applicantId || (isPreview ? 'preview-applicant-id' : '')
  })
  const [totalDue, setTotalDue] = useState(
    isPreview && previewStep === 3 ? previewOriginal - previewDiscount : batchPrice * 100
  )
  const [originalAmount, setOriginalAmount] = useState(
    isPreview && previewStep === 3 ? previewOriginal : batchPrice * 100
  )
  const [discountAmount, setDiscountAmount] = useState(
    isPreview && previewStep === 3 ? previewDiscount : 0
  )
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>('deposit')
  const [promoInput, setPromoInput] = useState(initialPromoCode || (isPreview ? 'SARAH200' : ''))
  const [appliedPromo, setAppliedPromo] = useState<PromoPreview | null>(previewPromoDefault)
  const [promoError, setPromoError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isPreview) return
    const lead = loadQuizLead()
    if (!lead) return

    if (!initialName && lead.name) setName(lead.name)
    if (!initialEmail && lead.email) setEmail(lead.email)
    if (lead.phone) setPhone(lead.phone)
    if (!initialApplicantId && lead.applicantId) setApplicantId(lead.applicantId)

    if (!previewStep && isCompleteQuizLead(lead)) {
      setStep(2)
    }

    const resolvedDate = resolveInitialDateChoice(dateOptions, initialDateIndex)
    if (resolvedDate !== null) setDateChoice(resolvedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only lead bootstrap
  }, [])

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
    const savedLead = loadQuizLead()
    const resolvedName = name.trim() || savedLead?.name?.trim() || ''
    const resolvedEmail = (email.trim() || savedLead?.email || '').toLowerCase()
    const resolvedPhone = phone.trim() || savedLead?.phone || ''

    if (applicantId) return applicantId

    if (savedLead?.applicantId && resolvedEmail && savedLead.email.toLowerCase() === resolvedEmail) {
      setApplicantId(savedLead.applicantId)
      return savedLead.applicantId
    }

    const storedAnswers = loadQuizAnswers()
    const quizPayload: Record<string, unknown> = {}
    if (storedAnswers) {
      const destination = getDestinationForBatch(batchSlug) ?? 'himalayan'
      const result = calculateQuizResult(storedAnswers, destination)
      quizPayload.answers = storedAnswers
      quizPayload.score = result.score
      // Keep the apply-page edition — do not let quiz recommendation overwrite it.
      quizPayload.batchRecommendation = batchSlug
    }

    const res = await fetch('/api/applicants/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: resolvedName,
        email: resolvedEmail,
        phone: normalizeIndianPhone(resolvedPhone),
        batchSlug,
        ...quizPayload,
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

      await ensureApplicantId()

      const due = promo?.finalAmount ?? batchPrice * 100
      setTotalDue(due)
      setOriginalAmount(promo?.originalAmount ?? batchPrice * 100)
      setDiscountAmount(promo?.discountAmount ?? 0)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedDate =
    dateChoice !== null ? dateOptions[dateChoice] : null

  const depositDue = depositAmountForTotal(totalDue)
  const { chargeNow, balanceDue } = calculatePaymentAmounts(totalDue, paymentPlan)

  const createPaymentOrder = async () => {
    const id = applicantId || (await ensureApplicantId())
    if (!id) throw new Error('Application profile not found.')

    const savedLead = loadQuizLead()
    const payload = {
      applicantId: id,
      name: name.trim() || savedLead?.name?.trim() || '',
      phone: phone.trim() || savedLead?.phone || '',
      gender,
      batchSlug,
      dateChoice,
      promoCode: appliedPromo?.code ?? undefined,
      paymentPlan,
    }

    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Could not create payment order.')
    }

    return {
      orderId: data.orderId as string,
      amount: data.amount as number,
      keyId: data.keyId as string | undefined,
      paymentPlan: (data.paymentPlan as PaymentPlan) ?? paymentPlan,
    }
  }

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
              {n === 1 ? 'About you' : n === 2 ? 'Pick your date' : 'Pay & confirm'}
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
            maleLabel={roseAccent ? 'A man' : 'A boy'}
            femaleLabel={roseAccent ? 'A woman' : 'A girl'}
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
              {isLoading ? 'Saving...' : 'Review & Pay →'}
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
                  <strong>{formatPaise(originalAmount)}</strong>
                </div>
                <div className="apply-review-row apply-review-discount">
                  <span>Discount</span>
                  <strong>−{formatPaise(discountAmount)}</strong>
                </div>
              </>
            )}
            <div className="apply-review-row apply-review-total">
              <span>Trip total</span>
              <strong>{formatPaise(totalDue)}</strong>
            </div>

            <div
              className="apply-payment-plans apply-payment-plans-in-review"
              role="radiogroup"
              aria-label="Payment option"
            >
              <p className="apply-payment-plans-heading">Choose how to pay</p>
              <label
                className={`apply-plan-option${paymentPlan === 'deposit' ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentPlan"
                  value="deposit"
                  checked={paymentPlan === 'deposit'}
                  onChange={() => setPaymentPlan('deposit')}
                />
                <span className="apply-plan-body">
                  <span className="apply-plan-title">
                    Slot booking — {DEPOSIT_PERCENT}% now
                  </span>
                  <span className="apply-plan-amount">{formatPaise(depositDue)}</span>
                  <span className="apply-plan-note">
                    Pay {formatPaise(totalDue - depositDue)} later before departure
                  </span>
                </span>
              </label>
              <label
                className={`apply-plan-option${paymentPlan === 'full' ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentPlan"
                  value="full"
                  checked={paymentPlan === 'full'}
                  onChange={() => setPaymentPlan('full')}
                />
                <span className="apply-plan-body">
                  <span className="apply-plan-title">Full payment</span>
                  <span className="apply-plan-amount">{formatPaise(totalDue)}</span>
                  <span className="apply-plan-note">Pay everything today — fully confirmed</span>
                </span>
              </label>
            </div>

            <div className="apply-review-row apply-review-charge">
              <span>Amount due now</span>
              <strong>{formatPaise(chargeNow)}</strong>
            </div>
            {paymentPlan === 'deposit' && balanceDue > 0 && (
              <p className="apply-plan-balance-note">
                Balance of {formatPaise(balanceDue)} due before your trip.
              </p>
            )}
          </div>

          <RazorpayButton
            applicantId={applicantId}
            batchName={batchName}
            email={email}
            name={name}
            prepareOrder={isPreview ? undefined : createPaymentOrder}
            orderId={isPreview ? 'dev_order_preview' : undefined}
            amount={isPreview ? chargeNow : undefined}
            payLabel={
              paymentPlan === 'deposit'
                ? `✦ Pay ${formatPaise(chargeNow)} & Reserve Slot →`
                : `✦ Pay ${formatPaise(chargeNow)} & Confirm Spot →`
            }
            onSuccess={(result) => {
              const plan = result?.paymentPlan ?? paymentPlan
              const q = plan === 'deposit' ? '&plan=deposit' : ''
              router.push(`${ROUTES.confirmation}?batch=${batchSlug}${q}`)
            }}
            onError={(msg) => setError(msg)}
          />

          <p className="trust-microline trust-microline--box">
            <span className="tm-mark" aria-hidden>
              ✦
            </span>
            Everyone in your batch is hand-verified.{' '}
            <strong>Can&apos;t verify you? Full refund.</strong>{' '}
            <a href={ROUTES.safety} target="_blank" rel="noopener noreferrer">
              How we vet →
            </a>
          </p>

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
