'use client'

import { useEffect, useState } from 'react'

interface RazorpayButtonProps {
  orderId: string
  amount: number
  applicantId: string
  batchName: string
  email: string
  name: string
  keyId?: string
  onSuccess: () => void
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
  orderId,
  amount,
  applicantId,
  batchName,
  email,
  name,
  keyId,
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
    const isDevOrder =
      process.env.NODE_ENV === 'development' && orderId.startsWith('dev_order_')

    if (isDevOrder) {
      setPaying(true)
      try {
        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: orderId,
            razorpayPaymentId: `dev_payment_${Date.now()}`,
            razorpaySignature: 'dev',
            applicantId,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Payment verification failed.')
        onSuccess()
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

    const razorpayKey = keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
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

          onSuccess()
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

    rzp.open()
  }

  return (
    <button
      type="button"
      className="apply-submit"
      onClick={handlePay}
      disabled={!scriptReady || paying}
    >
      {!scriptReady ? 'Loading payment...' : paying ? 'Processing...' : '✦ Pay & Confirm Spot →'}
    </button>
  )
}
