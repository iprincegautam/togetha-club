'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import OtpInput from '@/components/auth/OtpInput'
import '@/components/apply/apply.css'
import '@/components/auth/auth.css'

export default function PartnerResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const prefill = searchParams.get('email')
    if (prefill) setEmail(prefill)
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true)
    })
  }, [searchParams])

  const resetWithOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: 'partner',
          email,
          code: otp,
          password,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Reset failed')
      router.push(`${ROUTES.partnerLogin}?email=${encodeURIComponent(email)}&reset=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  const resetWithSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      router.push(ROUTES.partnerLogin)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="apply-shell" style={{ maxWidth: 420 }}>
      <p className="apply-eyebrow">✦ Partner ✦</p>
      <h1 className="apply-title">Set new password</h1>
      <p className="apply-sub">
        {hasSession
          ? 'Choose a new password for your partner account.'
          : 'Enter the code from your email and your new password.'}
      </p>

      <form className="apply-card" onSubmit={hasSession ? resetWithSession : resetWithOtp}>
        {!hasSession && (
          <>
            <div className="apply-field">
              <label className="apply-label" htmlFor="partner-reset-email">Email</label>
              <input
                id="partner-reset-email"
                type="email"
                required
                className="apply-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="apply-field">
              <label className="apply-label">Verification code</label>
              <OtpInput value={otp} onChange={setOtp} disabled={loading} />
            </div>
          </>
        )}
        <div className="apply-field">
          <label className="apply-label" htmlFor="partner-reset-password">New password</label>
          <input
            id="partner-reset-password"
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
          <label className="apply-label" htmlFor="partner-reset-confirm">Confirm password</label>
          <input
            id="partner-reset-confirm"
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
        <button
          type="submit"
          className="apply-submit"
          disabled={loading || (!hasSession && otp.length !== 6)}
        >
          {loading ? 'Saving…' : 'Update password →'}
        </button>
      </form>

      <div className="auth-links">
        <Link href={ROUTES.partnerForgotPassword}>Request a new code</Link>
        <Link href={ROUTES.partnerLogin}>← Back to sign in</Link>
      </div>
    </div>
  )
}
