'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import '@/components/apply/apply.css'
import '@/components/auth/auth.css'

export default function PartnerLoginForm() {
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
    if (searchParams.get('error') === 'forbidden') {
      setError('This account does not have partner access. Use your partner email or claim your portal first.')
    }
    if (searchParams.get('created') === '1') {
      setNotice('Partner account ready — sign in below.')
    }
    if (searchParams.get('reset') === '1') {
      setNotice('Password updated — sign in with your new password.')
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
      router.push(ROUTES.partner)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="apply-shell" style={{ maxWidth: 420 }}>
      <p className="apply-eyebrow">✦ Partner login ✦</p>
      <h1 className="apply-title">Influencer portal</h1>
      <p className="apply-sub">Track promo codes, conversions, and earnings.</p>

      <form className="apply-card" onSubmit={handleSubmit}>
        <div className="apply-field">
          <label className="apply-label" htmlFor="partner-email">Email</label>
          <input
            id="partner-email"
            type="email"
            className="apply-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
          />
        </div>
        <div className="apply-field">
          <label className="apply-label" htmlFor="partner-password">Password</label>
          <input
            id="partner-password"
            type="password"
            className="apply-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="apply-error">{error}</p>}
        {notice && <p className="account-msg">{notice}</p>}
        <button type="submit" className="apply-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>

      <div className="auth-links">
        <Link href={ROUTES.partnerForgotPassword}>Forgot password?</Link>
        <Link href={ROUTES.partnerSignup}>Create partner account</Link>
      </div>
    </div>
  )
}
