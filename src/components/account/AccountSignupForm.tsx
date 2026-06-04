'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import OtpInput from '@/components/auth/OtpInput'
import '@/components/apply/apply.css'
import '@/components/auth/auth.css'

type Step = 'details' | 'otp'

export default function AccountSignupForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOtp = async () => {
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: 'member',
          purpose: 'signup',
          email,
          password,
          name: name || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not send code')
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code')
    } finally {
      setLoading(false)
    }
  }

  const verifySignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/verify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: 'member',
          email,
          password,
          code: otp,
          name: name || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Verification failed')
      router.push(`${ROUTES.accountLogin}?email=${encodeURIComponent(email)}&created=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="apply-shell" style={{ maxWidth: 420 }}>
      <p className="apply-eyebrow">✦ Member signup ✦</p>
      <h1 className="apply-title">Create account</h1>
      <p className="apply-sub">
        Track bookings, pay balance, and manage your profile. We verify your email with a one-time code.
      </p>

      {step === 'details' ? (
        <form
          className="apply-card"
          onSubmit={(e) => {
            e.preventDefault()
            sendOtp()
          }}
        >
          <div className="apply-field">
            <label className="apply-label" htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              className="apply-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="apply-field">
            <label className="apply-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              required
              className="apply-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="apply-field">
            <label className="apply-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={8}
              className="apply-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="apply-field">
            <label className="apply-label" htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              type="password"
              required
              minLength={8}
              className="apply-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <p className="apply-error">{error}</p>}
          <button type="submit" className="apply-submit" disabled={loading}>
            {loading ? 'Sending code…' : 'Send verification code →'}
          </button>
        </form>
      ) : (
        <form className="apply-card" onSubmit={verifySignup}>
          <p className="auth-step-label">Enter the 6-digit code sent to {email}</p>
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />
          {error && <p className="apply-error">{error}</p>}
          <button type="submit" className="apply-submit" disabled={loading || otp.length !== 6}>
            {loading ? 'Creating account…' : 'Verify & create account →'}
          </button>
          <button
            type="button"
            className="account-btn-outline"
            style={{ width: '100%', marginTop: 12 }}
            disabled={loading}
            onClick={() => {
              setStep('details')
              setOtp('')
            }}
          >
            ← Back
          </button>
        </form>
      )}

      <div className="auth-links">
        <Link href={ROUTES.accountLogin}>Already have an account? Sign in</Link>
      </div>
    </div>
  )
}
