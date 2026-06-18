'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import OtpInput from '@/components/auth/OtpInput'
import { GLYPH } from '@/constants/brand-glyphs'

type PortalSecuritySectionProps = {
  portal: 'member' | 'partner'
  currentEmail: string
  forgotPasswordRoute: string
  loginRoute: string
}

export default function PortalSecuritySection({
  portal,
  currentEmail,
  forgotPasswordRoute,
  loginRoute,
}: PortalSecuritySectionProps) {
  const router = useRouter()
  const [newEmail, setNewEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [emailStep, setEmailStep] = useState<'idle' | 'otp'>('idle')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const apiBase = portal === 'member' ? '/api/account/settings' : '/api/partner/settings'

  const requestEmailOtp = async () => {
    setMsg(null)
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setEmailStep('otp')
      setMsg('Code sent to your new email address.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const confirmEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`${apiBase}/email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, code: otp }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setMsg('Email updated. Sign in again with your new address.')
      setEmailStep('idle')
      setOtp('')
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
      setTimeout(() => router.push(loginRoute), 1500)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push(loginRoute)
    router.refresh()
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)

    if (newPassword !== confirmPassword) {
      setMsg('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setMsg('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user.email) throw new Error('Session expired. Please sign in again.')

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      })
      if (verifyError) throw new Error('Current password is incorrect.')

      if (portal === 'member') {
        const res = await fetch('/api/account/settings/password', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Could not update password.')
      } else {
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
        if (updateError) throw updateError
      }

      setMsg('Password updated.')
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="account-stack">
      <div className="account-panel">
        <p className="apply-eyebrow">{GLYPH.spark} Account {GLYPH.spark}</p>
        <h2 className="account-panel-title">Sign-in & security</h2>
        <p className="account-sub" style={{ marginBottom: 12 }}>
          Current email: <strong>{currentEmail}</strong>
        </p>
        <p className="account-muted" style={{ marginBottom: 16 }}>
          {portal === 'member' ? (
            <>
              <button
                type="button"
                className="portal-link"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
                onClick={() => setShowPasswordForm((v) => !v)}
              >
                Change password
              </button>
              {' · '}
              <Link href={forgotPasswordRoute} className="portal-link">
                Forgot password
              </Link>
            </>
          ) : (
            <Link href={forgotPasswordRoute} className="portal-link">
              Change password
            </Link>
          )}{' '}
          (email OTP or recovery link)
        </p>
        {portal === 'member' && showPasswordForm && (
          <form onSubmit={changePassword} className="admin-form-grid" style={{ marginBottom: 16 }}>
            <label className="admin-field">
              <span>Current password</span>
              <input
                type="password"
                className="apply-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="admin-field">
              <span>New password</span>
              <input
                type="password"
                className="apply-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>
            <label className="admin-field">
              <span>Confirm new password</span>
              <input
                type="password"
                className="apply-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
        <button type="button" className="account-btn-outline" onClick={signOut}>
          Sign out
        </button>
      </div>

      <div className="account-panel">
        <h2 className="account-panel-title">Change email</h2>
        <p className="account-muted">We verify your new address with a 6-digit code.</p>

        {emailStep === 'idle' ? (
          <div className="admin-form-grid" style={{ marginTop: 12 }}>
            <label className="admin-field">
              <span>New email</span>
              <input
                type="email"
                className="apply-input"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={loading}
              />
            </label>
            <button type="button" className="admin-btn" disabled={loading} onClick={requestEmailOtp}>
              {loading ? 'Sending…' : 'Send verification code'}
            </button>
          </div>
        ) : (
          <form onSubmit={confirmEmail} style={{ marginTop: 12 }}>
            <OtpInput value={otp} onChange={setOtp} disabled={loading} />
            <button type="submit" className="admin-btn" style={{ marginTop: 12 }} disabled={loading || otp.length !== 6}>
              {loading ? 'Updating…' : 'Confirm new email'}
            </button>
            <button
              type="button"
              className="account-btn-outline"
              style={{ marginTop: 8, width: '100%' }}
              onClick={() => {
                setEmailStep('idle')
                setOtp('')
              }}
            >
              Cancel
            </button>
          </form>
        )}
        {msg && <p className="account-msg" style={{ marginTop: 12 }}>{msg}</p>}
      </div>
    </div>
  )
}
