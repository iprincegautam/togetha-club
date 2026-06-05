'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MOU_CLAUSES } from '@/lib/mou-text'
import { ROUTES } from '@/constants/routes'

type Props = {
  influencerName: string
  signed: boolean
  signedAt: string | null
  signerName: string | null
}

export default function PartnerMouForm({
  influencerName,
  signed,
  signedAt,
  signerName,
}: Props) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [fullName, setFullName] = useState(influencerName)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolled(true)
    }
  }, [])

  const submit = async () => {
    setError('')
    if (fullName.trim().toLowerCase() !== influencerName.trim().toLowerCase()) {
      setError('Name must match your partner profile name exactly.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/partner/sign-mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullNameConfirmed: fullName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not sign')
      router.push(ROUTES.partnerKyc)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign')
    } finally {
      setLoading(false)
    }
  }

  if (signed) {
    return (
      <div className="account-panel">
        <p className="account-msg" style={{ color: 'var(--teal-stamp)' }}>
          ✓ Agreement signed{signedAt ? ` on ${new Date(signedAt).toLocaleDateString('en-IN')}` : ''}
          {signerName ? ` — ${signerName}` : ''}
        </p>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className="account-stack">
      <div className="portal-mou-scroll" onScroll={onScroll}>
        {MOU_CLAUSES.map((c) => (
          <div key={c.num} className="portal-mou-clause">
            <h3>
              {c.num}. {c.title}
            </h3>
            <p>{c.body}</p>
          </div>
        ))}
      </div>

      <div className="account-panel">
        <label className="apply-label" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            disabled={!scrolled}
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          I have read the full agreement
        </label>
        {!scrolled && (
          <p className="account-muted" style={{ marginTop: 8 }}>
            Scroll to the bottom to enable signing.
          </p>
        )}
        <div className="apply-field" style={{ marginTop: 16 }}>
          <label className="apply-label" htmlFor="mou-name">
            Full legal name
          </label>
          <input
            id="mou-name"
            className="apply-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="apply-field">
          <label className="apply-label">Date</label>
          <input className="apply-input" readOnly value={today} />
        </div>
        {error && <p className="apply-error">{error}</p>}
        <button
          type="button"
          className="apply-submit"
          disabled={!agreed || !scrolled || loading}
          onClick={submit}
        >
          {loading ? 'Signing…' : 'Sign agreement →'}
        </button>
      </div>
    </div>
  )
}
