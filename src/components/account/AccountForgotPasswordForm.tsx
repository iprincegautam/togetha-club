'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import '@/components/apply/apply.css'
import '@/components/auth/auth.css'

export default function AccountForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: 'member',
          purpose: 'reset_password',
          email,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not send code')
      setSent(true)
      router.push(
        `${ROUTES.accountResetPassword}?email=${encodeURIComponent(email)}`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code')
    } finally {
      setLoading(false)
    }
  }

  const handleSupabaseReset = async () => {
    if (!email.includes('@')) {
      setError('Enter your email first.')
      return
    }
    setError('')
    const { createBrowserSupabaseClient } = await import('@/lib/supabase/client')
    const supabase = createBrowserSupabaseClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/account/reset-password`,
    })
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="apply-shell" style={{ maxWidth: 420 }}>
      <p className="apply-eyebrow">✦ Member ✦</p>
      <h1 className="apply-title">Forgot password</h1>
      <p className="apply-sub">We&apos;ll email you a 6-digit code to reset your password.</p>

      <form className="apply-card" onSubmit={handleSubmit}>
        <div className="apply-field">
          <label className="apply-label" htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            required
            className="apply-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || sent}
          />
        </div>
        {error && <p className="apply-error">{error}</p>}
        {sent && (
          <p className="account-msg">Code sent — redirecting…</p>
        )}
        <button type="submit" className="apply-submit" disabled={loading || sent}>
          {loading ? 'Sending…' : 'Send reset code →'}
        </button>
        <button
          type="button"
          className="account-btn-outline"
          style={{ width: '100%', marginTop: 12 }}
          onClick={handleSupabaseReset}
        >
          Or use email link instead
        </button>
      </form>

      <div className="auth-links">
        <Link href={ROUTES.accountLogin}>← Back to sign in</Link>
      </div>
    </div>
  )
}
