'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import '@/components/apply/apply.css'

export default function AccountLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    const prefill = searchParams.get('email')
    if (prefill) setEmail(prefill)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      const next = searchParams.get('next') || ROUTES.account
      router.push(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email.includes('@')) {
      setError('Enter your email first, then click reset password.')
      return
    }
    setError('')
    const supabase = createBrowserSupabaseClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/account/login`,
    })
    if (resetError) {
      setError(resetError.message)
      return
    }
    setResetSent(true)
  }

  return (
    <div className="apply-shell" style={{ maxWidth: 420 }}>
      <p className="apply-eyebrow">✦ Member login ✦</p>
      <h1 className="apply-title">Track your booking</h1>
      <p className="apply-sub">
        Use the email and password we sent after your payment was confirmed.
      </p>

      <form className="apply-card" onSubmit={handleSubmit}>
        <div className="apply-field">
          <label className="apply-label" htmlFor="account-email">Email</label>
          <input
            id="account-email"
            type="email"
            className="apply-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
          />
        </div>
        <div className="apply-field">
          <label className="apply-label" htmlFor="account-password">Password</label>
          <input
            id="account-password"
            type="password"
            className="apply-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
          />
        </div>

        {error && <p className="apply-error">{error}</p>}
        {resetSent && (
          <p className="account-msg">Password reset email sent — check your inbox.</p>
        )}

        <button type="submit" className="apply-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>

        <button
          type="button"
          className="account-btn-outline"
          style={{ width: '100%', marginTop: 12 }}
          onClick={handleReset}
        >
          Forgot password?
        </button>
      </form>

      <p className="apply-foot">
        <Link href={ROUTES.home} style={{ color: 'var(--ink-mid)' }}>← Back to site</Link>
      </p>
    </div>
  )
}
