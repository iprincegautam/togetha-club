'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import '@/components/apply/apply.css'
import '@/components/auth/auth.css'

export default function AccountLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const prefill = searchParams.get('email')
    if (prefill) setEmail(prefill)
    if (searchParams.get('created') === '1') {
      setNotice('Account created — sign in with your new password.')
    }
    if (searchParams.get('reset') === '1') {
      setNotice('Password updated — sign in with your new password.')
    }
    if (searchParams.get('error') === 'auth_callback') {
      setError('Reset link expired or invalid. Request a new code.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
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

  return (
    <div className="apply-shell" style={{ maxWidth: 420 }}>
      <p className="apply-eyebrow">✦ Member login ✦</p>
      <h1 className="apply-title">Track your booking</h1>
      <p className="apply-sub">
        Sign in to view your trip, pay balance, and update your profile.
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
        {notice && <p className="account-msg">{notice}</p>}

        <button type="submit" className="apply-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>

      <div className="auth-links">
        <Link href={ROUTES.accountForgotPassword}>Forgot password?</Link>
        <Link href={ROUTES.accountSignup}>Create an account</Link>
        <Link href={ROUTES.home}>← Back to site</Link>
      </div>
    </div>
  )
}
