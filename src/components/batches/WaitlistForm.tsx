'use client'

import { useState } from 'react'

interface WaitlistFormProps {
  accentColor?: string
}

export default function WaitlistForm({ accentColor = 'var(--lavender)' }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState<'m' | 'f' | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!email.includes('@')) {
      setStatus('error')
      setErrorMsg('Please enter a valid email address.')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, gender }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }

      setStatus('success')
      if (data.alreadyJoined) {
        setErrorMsg('')
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <form className="waitlist-form-wrap" onSubmit={handleSubmit}>
      <div className="date-picker-label" style={{ marginBottom: 10 }}>
        Join the waitlist — get first access
      </div>
      <input
        type="email"
        className="waitlist-email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'loading' || status === 'success'}
        style={{ borderColor: status === 'error' ? 'var(--red-stamp)' : accentColor }}
      />
      <div className="gender-options" style={{ marginBottom: 8 }}>
        <button
          type="button"
          className={`gender-btn lavender-border${gender === 'm' ? ' active-m' : ''}`}
          onClick={() => setGender('m')}
          disabled={status === 'loading' || status === 'success'}
        >
          A boy
        </button>
        <button
          type="button"
          className={`gender-btn lavender-border${gender === 'f' ? ' active-f' : ''}`}
          onClick={() => setGender('f')}
          disabled={status === 'loading' || status === 'success'}
        >
          A girl
        </button>
      </div>
      <button
        type="submit"
        className="waitlist-submit"
        disabled={status === 'loading' || status === 'success'}
        style={{ background: accentColor }}
      >
        {status === 'loading' ? '...' : status === 'success' ? '✓ On the list!' : '♡ Join the Waitlist →'}
      </button>
      {status === 'success' && (
        <p className="waitlist-msg success">✓ You&apos;re on the list! We&apos;ll email you first.</p>
      )}
      {status === 'error' && errorMsg && (
        <p className="waitlist-msg error" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  )
}
