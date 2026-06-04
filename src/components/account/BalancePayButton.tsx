'use client'

import { useEffect, useState } from 'react'
import { formatPaise } from '@/lib/utils'

interface BalancePayButtonProps {
  email: string
  name: string
  batchName: string
  balanceDue: number
  onPaid: () => void
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

export default function BalancePayButton({
  email,
  name,
  batchName,
  balanceDue,
  onPaid,
  onError,
}: BalancePayButtonProps) {
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
    document.body.appendChild(script)
  }, [])

  const verifyPayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) => {
    const res = await fetch('/api/account/balance-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Verification failed')
    onPaid()
  }

  const handlePay = async () => {
    setPaying(true)
    try {
      const res = await fetch('/api/account/balance-order', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not start payment')

      const { orderId, amount, keyId, customerId } = json
      const isDev = orderId.startsWith('dev_balance_')

      if (isDev) {
        await verifyPayment(orderId, `dev_payment_${Date.now()}`, 'dev')
        setPaying(false)
        return
      }

      if (!scriptReady || !window.Razorpay) {
        throw new Error('Payment gateway is still loading.')
      }

      const razorpayKey = keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!razorpayKey) throw new Error('Payment is not configured.')

      const rzp = new window.Razorpay({
        key: razorpayKey,
        order_id: orderId,
        amount,
        currency: 'INR',
        name: 'Togetha.Club',
        description: `${batchName} — balance`,
        prefill: { name, email },
        ...(customerId ? { customer_id: customerId, save: 1 } : {}),
        handler: async (response: RazorpayResponse) => {
          try {
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            )
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Verification failed')
          } finally {
            setPaying(false)
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      })
      rzp.open()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed')
      setPaying(false)
    }
  }

  return (
    <button type="button" className="apply-submit" onClick={handlePay} disabled={!scriptReady || paying}>
      {!scriptReady ? 'Loading payment…' : paying ? 'Processing…' : `✦ Pay ${formatPaise(balanceDue)} balance →`}
    </button>
  )
}
