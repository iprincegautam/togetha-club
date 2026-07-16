'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BookingPipeline from '@/components/account/BookingPipeline'
import BalancePayButton from '@/components/account/BalancePayButton'
import ClaimPaymentForm from '@/components/account/ClaimPaymentForm'
import { ROUTES } from '@/constants/routes'
import { formatPaise } from '@/lib/utils'

interface AccountData {
  profile: { email: string; fullName: string | null }
  booking: {
    status: string
    stageIndex: number
    completedThrough?: number
    stepStates?: ('done' | 'current' | 'pending')[]
    batchName: string | null
    batchSlug: string | null
    dateChoice: string | null
    paymentPlan: string | null
    amountPaid: number | null
    balanceDue: number | null
    finalAmount: number | null
    originalAmount: number | null
    discountAmount: number | null
    kycStatus: string
  }
  hasVerifiedPayment: boolean
  profileComplete: boolean
  profileKycApproved: boolean
  canPayBalance: boolean
  canCompleteQuiz: boolean
  packagePriceLabel: string
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash !== '#pay-balance') return
    const el = document.getElementById('pay-balance')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [data, loading])

  if (loading) return <p className="account-muted">Loading your booking…</p>
  if (!data?.booking) {
    return (
      <p className="account-muted">
        No booking is linked to this account yet. Contact hello@togetha.club if you expected access.
      </p>
    )
  }

  const { booking, profile, hasVerifiedPayment, profileComplete, profileKycApproved, canPayBalance, canCompleteQuiz } = data
  const hasBalanceOwed =
    hasVerifiedPayment && booking.status === 'deposit_paid' && (booking.balanceDue ?? 0) > 0
  const awaitingProfileApproval =
    hasBalanceOwed && profileComplete && !profileKycApproved && booking.kycStatus !== 'rejected'

  return (
    <div className="account-stack">
      <div className="account-panel">
        <p className="apply-eyebrow">✦ Welcome back ✦</p>
        <h1 className="account-title">
          {profile.fullName ? `Hi, ${profile.fullName.split(' ')[0]}` : 'Your booking'}
        </h1>
        <p className="account-sub">{profile.email}</p>
      </div>

      {!hasVerifiedPayment && (
        <ClaimPaymentForm
          onClaimed={load}
          packagePriceLabel={data.packagePriceLabel ?? 'the package price'}
        />
      )}

      {hasVerifiedPayment && canCompleteQuiz && (
        <div className="account-panel" style={{ borderColor: 'var(--teal-stamp)' }}>
          <h2 className="account-panel-title">Complete your profile</h2>
          <p className="account-sub">
            Payment linked — take the compatibility quiz and choose your batch to finish your
            booking profile.
          </p>
          <Link href={ROUTES.accountCompleteProfile} className="apply-submit" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
            Start quiz →
          </Link>
        </div>
      )}

      {hasVerifiedPayment && (
        <>
          <div className="account-panel">
            <h2 className="account-panel-title">Booking status</h2>
            <BookingPipeline
              stageIndex={booking.stageIndex}
              completedThrough={booking.completedThrough}
              stepStates={booking.stepStates}
              status={booking.status}
            />
            {booking.stageIndex >= 4 &&
              booking.status !== 'rejected' && (
              <p className="account-msg" style={{ marginTop: 12 }}>
                Your slot is confirmed for this departure. We&apos;ll email you pre-trip details
                before you leave.
                {canPayBalance
                  ? " You're approved — pay your remaining balance within 48 hours to confirm your spot."
                  : null}
              </p>
            )}
            {profileComplete && booking.stageIndex < 4 && !profileKycApproved && (
              <p className="account-msg" style={{ marginTop: 12 }}>
                Profile complete — your quiz and batch preferences are saved.
                {awaitingProfileApproval
                  ? ' Our team is reviewing your profile; balance payment opens after approval.'
                  : null}
              </p>
            )}
            {profileKycApproved && hasBalanceOwed && booking.stageIndex < 4 && (
              <p className="account-msg" style={{ marginTop: 12 }}>
                Profile approved — finishing up your booking status…
              </p>
            )}
          </div>

          <div className="account-panel">
            <h2 className="account-panel-title">Trip & payment details</h2>
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
                <dt>Package</dt>
                <dd>
                  {booking.originalAmount != null
                    ? formatPaise(booking.originalAmount)
                    : '—'}
                  {booking.discountAmount != null && booking.discountAmount > 0 && (
                    <> · discount −{formatPaise(booking.discountAmount)}</>
                  )}
                </dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>
                  {!hasVerifiedPayment
                    ? 'Awaiting payment link'
                    : booking.paymentPlan === 'deposit'
                      ? 'Deposit paid'
                      : 'Paid in full'}
                  {booking.amountPaid != null && booking.amountPaid > 0 && (
                    <> · {formatPaise(booking.amountPaid)}</>
                  )}
                </dd>
              </div>
              {hasBalanceOwed && (
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
        </>
      )}

      {canPayBalance && (
        <div className="account-panel" id="pay-balance">
          <h2 className="account-panel-title">Pay remaining balance</h2>
          <p className="account-sub">
            You&apos;re approved for this trip. Pay your remaining balance within 48 hours to lock
            your spot — after that, your slot may be released to someone on the waitlist.
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
