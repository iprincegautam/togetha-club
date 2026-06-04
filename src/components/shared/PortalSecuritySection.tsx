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

  return (
    <div className="account-stack">
      <div className="account-panel">
        <p className="apply-eyebrow">{GLYPH.spark} Account {GLYPH.spark}</p>
        <h2 className="account-panel-title">Sign-in & security</h2>
        <p className="account-sub" style={{ marginBottom: 12 }}>
          Current email: <strong>{currentEmail}</strong>
        </p>
        <p className="account-muted" style={{ marginBottom: 16 }}>
          <Link href={forgotPasswordRoute}>Change password</Link> (email OTP or recovery link)
        </p>
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
