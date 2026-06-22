'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import PortalSignOutButton from '@/components/auth/PortalSignOutButton'
import '@/components/apply/apply.css'

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('error') === 'forbidden') {
      setError('This account does not have admin access. Use an email listed in ADMIN_EMAILS, or ask ops to set your profile role to ops.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        throw authError
      }

      router.push(ROUTES.admin)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setInfo('')

    if (!email.includes('@')) {
      setError('Enter your email above, then click forgot password.')
      return
    }

    setResetLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/account/reset-password`,
      })

      if (resetError) {
        throw resetError
      }

      setInfo('Password reset email sent. Check your inbox, then return here to sign in.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="apply-shell" style={{ maxWidth: 420 }}>
        <p className="apply-eyebrow">✦ Admin ✦</p>
        <h1 className="apply-title">Sign in</h1>
        <p className="apply-sub">Team access only.</p>

        <form className="apply-card" onSubmit={handleSubmit}>
          <div className="apply-field">
            <label className="apply-label" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              className={`apply-input${error ? ' error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@togetha.club"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="apply-field">
            <label className="apply-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className={`apply-input${error ? ' error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="apply-error" role="alert">
              {error}
            </p>
          )}

          {info && (
            <p className="apply-sub" role="status" style={{ marginBottom: 0 }}>
              {info}
            </p>
          )}

          <button type="submit" className="apply-submit" disabled={loading || resetLoading}>
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>

          <p style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              className="portal-link"
              onClick={handleForgotPassword}
              disabled={loading || resetLoading}
            >
              {resetLoading ? 'Sending reset email...' : 'Forgot password?'}
            </button>
          </p>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <PortalSignOutButton
            redirectTo={ROUTES.adminLogin}
            label="Clear session"
            className="account-btn-outline"
          />
        </div>
      </div>
    </div>
  )
}
