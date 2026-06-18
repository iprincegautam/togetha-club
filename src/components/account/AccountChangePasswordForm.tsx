'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import '@/components/apply/apply.css'
import '@/components/auth/auth.css'

type AccountChangePasswordFormProps = {
  /** First login after payment — skip current password field. */
  firstLogin?: boolean
}

export default function AccountChangePasswordForm({
  firstLogin = false,
}: AccountChangePasswordFormProps) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Your session expired. Please sign in again.')
      }

      if (!firstLogin) {
        const email = session.user.email
        if (!email) throw new Error('No email on this account.')
        if (!currentPassword) {
          setError('Enter your current password.')
          setLoading(false)
          return
        }

        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        })
        if (verifyError) throw new Error('Current password is incorrect.')
      }

      const res = await fetch('/api/account/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not update password.')

      router.push(firstLogin ? ROUTES.account : ROUTES.accountSettings)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="apply-shell" style={{ maxWidth: 420 }}>
      <p className="apply-eyebrow">✦ Member ✦</p>
      <h1 className="apply-title">
        {firstLogin ? 'Set your password' : 'Change password'}
      </h1>
      <p className="apply-sub">
        {firstLogin
          ? 'Choose a personal password for your member account. You will use this to log in from now on.'
          : 'Enter your current password, then choose a new one.'}
      </p>

      <form className="apply-card" onSubmit={handleSubmit}>
        {!firstLogin && (
          <div className="apply-field">
            <label className="apply-label" htmlFor="change-current">Current password</label>
            <input
              id="change-current"
              type="password"
              required
              className="apply-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
        )}
        <div className="apply-field">
          <label className="apply-label" htmlFor="change-password">New password</label>
          <input
            id="change-password"
            type="password"
            required
            minLength={8}
            className="apply-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
          />
        </div>
        <div className="apply-field">
          <label className="apply-label" htmlFor="change-confirm">Confirm new password</label>
          <input
            id="change-confirm"
            type="password"
            required
            minLength={8}
            className="apply-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="apply-error">{error}</p>}
        <button type="submit" className="apply-submit" disabled={loading}>
          {loading ? 'Saving…' : firstLogin ? 'Save password & continue →' : 'Update password →'}
        </button>
      </form>
    </div>
  )
}
