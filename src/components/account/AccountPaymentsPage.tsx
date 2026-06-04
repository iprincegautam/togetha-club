'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { GLYPH } from '@/constants/brand-glyphs'

interface SavedCard {
  id: string
  last4: string | null
  network: string | null
  type: string | null
  bank: string | null
  expired: boolean
}

export default function AccountPaymentsPage() {
  const [configured, setConfigured] = useState(true)
  const [cards, setCards] = useState<SavedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/account/payments')
      .then((r) => r.json())
      .then((json) => {
        setConfigured(json.configured !== false)
        setCards(json.cards ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const removeCard = async (tokenId: string) => {
    if (!confirm('Remove this saved card?')) return
    setRemovingId(tokenId)
    setMsg(null)
    const res = await fetch(`/api/account/payments/${tokenId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) setMsg(json.error ?? 'Could not remove card')
    else {
      setMsg('Card removed')
      load()
    }
    setRemovingId(null)
  }

  if (loading) return <p className="account-muted">Loading payment methods…</p>

  return (
    <div className="account-stack">
      <div className="account-panel">
        <p className="apply-eyebrow">{GLYPH.spark} Payments {GLYPH.spark}</p>
        <h1 className="account-title">Saved cards</h1>
        <p className="account-sub">
          Cards saved when you pay your trip balance appear here for faster checkout next time.
        </p>
        <p className="account-muted">
          <Link href={ROUTES.account}>Pay balance from My booking</Link>
          {' · '}
          <Link href={ROUTES.accountSettings}>Account settings</Link>
        </p>
      </div>

      {!configured ? (
        <div className="account-panel">
          <p className="account-muted">Payment gateway is not configured in this environment.</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="account-panel">
          <p className="account-muted">No saved cards yet.</p>
          <p className="account-muted" style={{ marginTop: 8 }}>
            When paying your balance, check <strong>Save card</strong> in the Razorpay window to store it here.
          </p>
        </div>
      ) : (
        <div className="account-panel">
          <h2 className="account-panel-title">Your cards</h2>
          <ul className="account-card-list">
            {cards.map((card) => (
              <li key={card.id} className="account-card-list-item">
                <div>
                  <strong>
                    {card.network ?? 'Card'} {card.last4 ? `•••• ${card.last4}` : ''}
                  </strong>
                  {card.bank && (
                    <span className="account-muted" style={{ display: 'block' }}>
                      {card.bank}
                    </span>
                  )}
                  {card.expired && (
                    <span className="apply-error" style={{ fontSize: '0.8rem' }}>
                      Expired
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="admin-link-btn admin-danger"
                  disabled={removingId === card.id}
                  onClick={() => removeCard(card.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {msg && <p className="account-msg">{msg}</p>}

      <p className="account-foot">
        <Link href={ROUTES.accountSettings} className="admin-inline-link">
          ← Account settings
        </Link>
      </p>
    </div>
  )
}
