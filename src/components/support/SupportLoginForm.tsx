'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import '@/components/apply/apply.css'
import '@/components/auth/auth.css'

export default function SupportLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const prefill = searchParams.get('email')
    if (prefill) setEmail(prefill)
    if (searchParams.get('error') === 'forbidden') {
      setError('This account does not have support portal access. Contact your admin.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      router.push(ROUTES.support)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="apply-shell" style={{ maxWidth: 420 }}>
      <p className="apply-eyebrow">✦ Support login ✦</p>
      <h1 className="apply-title">Support portal</h1>
      <p className="apply-sub">Guide applicants through booking and member portal setup.</p>

      <form className="apply-card" onSubmit={handleSubmit}>
        <div className="apply-field">
          <label className="apply-label" htmlFor="support-email">Email</label>
          <input
            id="support-email"
            type="email"
            className="apply-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
          />
        </div>
        <div className="apply-field">
          <label className="apply-label" htmlFor="support-password">Password</label>
          <input
            id="support-password"
            type="password"
            className="apply-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="apply-error">{error}</p>}
        <button type="submit" className="apply-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
    </div>
  )
}
