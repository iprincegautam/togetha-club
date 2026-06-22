'use client'

import { useState } from 'react'
import { DIRECT_SALE_COUPONS } from '@/lib/package-pricing'
import { formatPaise } from '@/lib/utils'

type ClaimPaymentFormProps = {
  onClaimed: () => void
  packagePriceLabel: string
}

export default function ClaimPaymentForm({ onClaimed, packagePriceLabel }: ClaimPaymentFormProps) {
  const [paymentId, setPaymentId] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    status: string
    amountPaid: number
    balanceDue: number
    discountAmount: number
    finalAmount: number
    couponCode: string | null
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/account/claim-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpayPaymentId: paymentId.trim().replace(/^pay_/i, 'pay_'),
        couponCode: couponCode.trim() || undefined,
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Could not link payment')
      setLoading(false)
      return
    }

    setSuccess({
      status: json.status,
      amountPaid: json.amountPaid,
      balanceDue: json.balanceDue,
      discountAmount: json.discountAmount,
      finalAmount: json.finalAmount,
      couponCode: json.couponCode,
    })
    setLoading(false)
    onClaimed()
  }

  return (
    <div className="account-panel account-claim-payment">
      <h2 className="account-panel-title">Link your Razorpay payment</h2>
      <p className="account-sub">
        After paying {packagePriceLabel} (or your discounted amount), paste the payment ID
        from your Razorpay receipt or confirmation email. It starts with <code>pay_</code>.
      </p>

      <form onSubmit={handleSubmit} className="account-stack" style={{ marginTop: 16 }}>
        <label className="apply-label" htmlFor="claim-payment-id">
          Razorpay payment ID
        </label>
        <input
          id="claim-payment-id"
          className="apply-input"
          value={paymentId}
          onChange={(e) => {
            const v = e.target.value
            setPaymentId(v.replace(/^pay_/i, (m) => m.toLowerCase()))
          }}
          placeholder="pay_XXXXXXXXXXXXXX"
          disabled={loading}
          autoComplete="off"
        />

        <label className="apply-label" htmlFor="claim-coupon">
          Coupon code (optional)
        </label>
        <input
          id="claim-coupon"
          className="apply-input"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="STANDARD, MAX, or your promo code"
          disabled={loading}
          autoComplete="off"
        />
        <p className="account-muted" style={{ fontSize: 13 }}>
          Available: {Object.keys(DIRECT_SALE_COUPONS).join(', ')} — both give 10% off{' '}
          {packagePriceLabel}.
        </p>

        {error && (
          <p className="apply-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <div className="account-msg" role="status">
            Payment linked — status: {success.status.replace('_', ' ')}.
            {success.amountPaid > 0 && (
              <>
                {' '}
                Paid {formatPaise(success.amountPaid)}
                {success.discountAmount > 0 && (
                  <> (coupon {success.couponCode}: −{formatPaise(success.discountAmount)})</>
                )}
                .
              </>
            )}
            {success.balanceDue > 0 && <> Balance due: {formatPaise(success.balanceDue)}.</>}
          </div>
        )}

        <button type="submit" className="apply-submit" disabled={loading || !paymentId.trim()}>
          {loading ? 'Verifying…' : 'Save & verify payment →'}
        </button>
      </form>
    </div>
  )
}
