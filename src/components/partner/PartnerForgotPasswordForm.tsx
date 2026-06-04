'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import '@/components/apply/apply.css'
import '@/components/auth/auth.css'

export default function PartnerForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: 'partner',
          purpose: 'reset_password',
          email,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not send code')
      router.push(
        `${ROUTES.partnerResetPassword}?email=${encodeURIComponent(email)}`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="apply-shell" style={{ maxWidth: 420 }}>
      <p className="apply-eyebrow">✦ Partner ✦</p>
      <h1 className="apply-title">Forgot password</h1>
      <p className="apply-sub">We&apos;ll email a 6-digit code to reset your partner login.</p>

      <form className="apply-card" onSubmit={handleSubmit}>
        <div className="apply-field">
          <label className="apply-label" htmlFor="partner-forgot-email">Email</label>
          <input
            id="partner-forgot-email"
            type="email"
            required
            className="apply-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        {error && <p className="apply-error">{error}</p>}
        <button type="submit" className="apply-submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset code →'}
        </button>
      </form>

      <div className="auth-links">
        <Link href={ROUTES.partnerLogin}>← Back to sign in</Link>
      </div>
    </div>
  )
}
