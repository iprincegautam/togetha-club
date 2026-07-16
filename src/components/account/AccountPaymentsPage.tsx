'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import BalancePayButton from '@/components/account/BalancePayButton'
import { ROUTES } from '@/constants/routes'
import { GLYPH } from '@/constants/brand-glyphs'
import { formatPaise } from '@/lib/utils'

interface SavedCard {
  id: string
  last4: string | null
  network: string | null
  type: string | null
  bank: string | null
  expired: boolean
}

interface AccountMe {
  profile: { email: string; fullName: string | null }
  booking: {
    batchName: string | null
    balanceDue: number | null
    kycStatus: string
  }
  profileComplete: boolean
  profileKycApproved: boolean
  canPayBalance: boolean
}

export default function AccountPaymentsPage() {
  const [configured, setConfigured] = useState(true)
  const [cards, setCards] = useState<SavedCard[]>([])
  const [account, setAccount] = useState<AccountMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/account/payments').then((r) => r.json()),
      fetch('/api/account/me').then((r) => r.json()),
    ])
      .then(([paymentsJson, meJson]) => {
        setConfigured(paymentsJson.configured !== false)
        setCards(paymentsJson.cards ?? [])
        if (meJson?.booking) setAccount(meJson as AccountMe)
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

  const balance = account?.booking.balanceDue ?? 0
  const awaitingApproval =
    account?.profileComplete &&
    !account?.profileKycApproved &&
    balance > 0 &&
    account?.booking.kycStatus !== 'rejected'

  return (
    <div className="account-stack">
      <div className="account-panel">
        <p className="apply-eyebrow">{GLYPH.spark} Payments {GLYPH.spark}</p>
        <h1 className="account-title">Trip balance</h1>
        <p className="account-sub">
          Pay your remaining balance here after your profile is approved. Saved cards appear below
          for faster checkout.
        </p>
      </div>

      {account?.canPayBalance && balance > 0 && (
        <div className="account-panel" id="pay-balance">
          <h2 className="account-panel-title">Pay remaining balance</h2>
          <p className="account-sub" style={{ marginBottom: 12 }}>
            Balance due: <strong>{formatPaise(balance)}</strong> — due within 48 hours of approval to
            lock your spot.
          </p>
          {msg && <p className="account-msg">{msg}</p>}
          <BalancePayButton
            email={account.profile.email}
            name={account.profile.fullName ?? account.profile.email}
            batchName={account.booking.batchName ?? 'Togetha.Club'}
            balanceDue={balance}
            onPaid={() => {
              setMsg('Balance paid — thank you!')
              load()
            }}
            onError={setMsg}
          />
        </div>
      )}

      {awaitingApproval && (
        <div className="account-panel">
          <h2 className="account-panel-title">Balance payment locked</h2>
          <p className="account-muted">
            Your profile is under review. Balance payment opens after our team approves your
            application — usually within 24–36 hours.
          </p>
          <p className="account-muted" style={{ marginTop: 8 }}>
            Balance due: {formatPaise(balance)}
          </p>
        </div>
      )}

      {!account?.canPayBalance && !awaitingApproval && balance <= 0 && account && (
        <div className="account-panel">
          <p className="account-muted">No balance due on your booking right now.</p>
          <p className="account-muted" style={{ marginTop: 8 }}>
            <Link href={ROUTES.account} className="portal-link">
              View booking status
            </Link>
          </p>
        </div>
      )}

      <div className="account-panel">
        <h2 className="account-panel-title">Saved cards</h2>
        <p className="account-sub">
          Cards saved when you pay your trip balance appear here for faster checkout next time.
        </p>
        {!account?.canPayBalance && balance > 0 && (
          <p className="account-muted" style={{ marginTop: 8 }}>
            <Link href={ROUTES.accountPayBalance} className="portal-link">
              Pay balance from My booking
            </Link>{' '}
            once your profile is approved.
          </p>
        )}
      </div>

      {!configured ? (
        <div className="account-panel">
          <p className="account-muted">Payment gateway is not configured in this environment.</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="account-panel">
          <p className="account-muted">No saved cards yet.</p>
          <p className="account-muted" style={{ marginTop: 8 }}>
            When paying your balance, check <strong>Save card</strong> in the Razorpay window to
            store it here.
          </p>
        </div>
      ) : (
        <div className="account-panel">
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

      {msg && !account?.canPayBalance && <p className="account-msg">{msg}</p>}
    </div>
  )
}
