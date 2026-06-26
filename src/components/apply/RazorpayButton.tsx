'use client'

import { useEffect, useState } from 'react'
import { trackPaymentInitiated, trackPurchaseWithConfirmationBackup } from '@/lib/meta-pixel'

export interface PreparedOrder {
  orderId: string
  amount: number
  keyId?: string
  paymentPlan?: 'deposit' | 'full'
}

interface RazorpayButtonProps {
  orderId?: string
  amount?: number
  applicantId: string
  batchName: string
  email: string
  name: string
  keyId?: string
  prepareOrder?: () => Promise<PreparedOrder>
  payLabel?: string
  onSuccess: (result?: { paymentPlan?: 'deposit' | 'full' }) => void
  onError: (msg: string) => void
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export default function RazorpayButton({
  orderId: initialOrderId,
  amount: initialAmount,
  applicantId,
  batchName,
  email,
  name,
  keyId: initialKeyId,
  prepareOrder,
  payLabel = '✦ Pay & Confirm Spot →',
  onSuccess,
  onError,
}: RazorpayButtonProps) {
  const [scriptReady, setScriptReady] = useState(false)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      setScriptReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setScriptReady(true)
    script.onerror = () => onError('Failed to load payment gateway. Please refresh and try again.')
    document.body.appendChild(script)
  }, [onError])

  const handlePay = async () => {
    let orderId = initialOrderId
    let amount = initialAmount
    let keyId = initialKeyId
    let paymentPlan: 'deposit' | 'full' | undefined

    if (prepareOrder) {
      try {
        const prepared = await prepareOrder()
        orderId = prepared.orderId
        amount = prepared.amount
        keyId = prepared.keyId ?? keyId
        paymentPlan = prepared.paymentPlan
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Could not start payment.')
        return
      }
    }

    if (!orderId || amount === undefined) {
      onError('Payment is not ready. Please try again.')
      return
    }

    const isDevOrder =
      process.env.NODE_ENV === 'development' && orderId.startsWith('dev_order_')

    if (isDevOrder) {
      setPaying(true)
      const devPaymentId = `dev_payment_${Date.now()}`
      try {
        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: orderId,
            razorpayPaymentId: devPaymentId,
            razorpaySignature: 'dev',
            applicantId,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Payment verification failed.')
        trackPurchaseWithConfirmationBackup(amount / 100, devPaymentId)
        onSuccess({ paymentPlan: data.paymentPlan ?? paymentPlan })
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Payment verification failed.')
      } finally {
        setPaying(false)
      }
      return
    }

    if (!scriptReady || !window.Razorpay) {
      onError('Payment gateway is still loading. Please wait a moment.')
      return
    }

    const razorpayKey = keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!razorpayKey) {
      onError('Payment is not configured. Please contact support.')
      return
    }

    setPaying(true)

    const rzp = new window.Razorpay({
      key: razorpayKey,
      order_id: orderId,
      amount,
      currency: 'INR',
      name: 'Togetha.Club',
      description: batchName,
      prefill: { name, email },
      handler: async (response: RazorpayResponse) => {
        try {
          const res = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              applicantId,
            }),
          })

          const data = await res.json()

          if (!res.ok) {
            throw new Error(data.error || 'Payment verification failed.')
          }

          trackPurchaseWithConfirmationBackup(amount / 100, response.razorpay_payment_id)

          onSuccess({
            paymentPlan: data.paymentPlan ?? paymentPlan,
          })
        } catch (err) {
          onError(err instanceof Error ? err.message : 'Payment verification failed.')
        } finally {
          setPaying(false)
        }
      },
      modal: {
        ondismiss: () => setPaying(false),
      },
    })

    trackPaymentInitiated(amount / 100)
    rzp.open()
  }

  return (
    <button
      type="button"
      className="apply-submit"
      onClick={handlePay}
      disabled={!scriptReady || paying}
    >
      {!scriptReady ? 'Loading payment...' : paying ? 'Processing...' : payLabel}
    </button>
  )
}
