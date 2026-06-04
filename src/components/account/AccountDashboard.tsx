'use client'

import { useEffect, useState } from 'react'
import BookingPipeline from '@/components/account/BookingPipeline'
import BalancePayButton from '@/components/account/BalancePayButton'
import { formatPaise } from '@/lib/utils'

interface AccountData {
  profile: { email: string; fullName: string | null }
  booking: {
    status: string
    stageIndex: number
    batchName: string | null
    batchSlug: string | null
    dateChoice: string | null
    paymentPlan: string | null
    amountPaid: number | null
    balanceDue: number | null
    kycStatus: string
  }
}

export default function AccountDashboard() {
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [payMsg, setPayMsg] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/account/me')
      .then((r) => r.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <p className="account-muted">Loading your booking…</p>
  if (!data?.booking) {
    return (
      <p className="account-muted">
        No booking is linked to this account yet. If you just paid, wait a minute and refresh — or
        contact hello@togetha.club.
      </p>
    )
  }

  const { booking, profile } = data
  const showBalance =
    booking.status === 'deposit_paid' && (booking.balanceDue ?? 0) > 0

  return (
    <div className="account-stack">
      <div className="account-panel">
        <p className="apply-eyebrow">✦ Welcome back ✦</p>
        <h1 className="account-title">
          {profile.fullName ? `Hi, ${profile.fullName.split(' ')[0]}` : 'Your booking'}
        </h1>
        <p className="account-sub">{profile.email}</p>
      </div>

      <div className="account-panel">
        <h2 className="account-panel-title">Booking status</h2>
        <BookingPipeline stageIndex={booking.stageIndex} status={booking.status} />
      </div>

      <div className="account-panel">
        <h2 className="account-panel-title">Trip details</h2>
        <dl className="account-dl">
          <div>
            <dt>Batch</dt>
            <dd>{booking.batchName ?? booking.batchSlug ?? '—'}</dd>
          </div>
          <div>
            <dt>Departure</dt>
            <dd>{booking.dateChoice ?? '—'}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>
              {booking.paymentPlan === 'deposit' ? 'Deposit paid' : 'Paid in full'}
              {booking.amountPaid != null && ` · ${formatPaise(booking.amountPaid)}`}
            </dd>
          </div>
          {showBalance && (
            <div>
              <dt>Balance due</dt>
              <dd className="account-balance">{formatPaise(booking.balanceDue!)}</dd>
            </div>
          )}
          <div>
            <dt>Profile / KYC</dt>
            <dd>{booking.kycStatus.replace('_', ' ')}</dd>
          </div>
        </dl>
      </div>

      {showBalance && (
        <div className="account-panel">
          <h2 className="account-panel-title">Pay remaining balance</h2>
          <p className="account-sub">
            Complete your payment to confirm your spot in full before departure.
          </p>
          {payMsg && <p className="account-msg">{payMsg}</p>}
          <BalancePayButton
            email={profile.email}
            name={profile.fullName ?? profile.email}
            batchName={booking.batchName ?? 'Togetha.Club'}
            balanceDue={booking.balanceDue!}
            onPaid={() => {
              setPayMsg('Balance paid — thank you!')
              load()
            }}
            onError={setPayMsg}
          />
        </div>
      )}
    </div>
  )
}
