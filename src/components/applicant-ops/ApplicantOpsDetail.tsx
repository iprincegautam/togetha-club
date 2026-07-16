'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import {
  applicantAmountPaidLabel,
  applicantBalanceDueLabel,
  canResendMemberCredentials,
  hasVerifiedPayment,
} from '@/lib/applicant-payment'
import { isProfileKycApproved, kycStatusLabel } from '@/lib/applicant-kyc'
import { isProfileComplete } from '@/lib/payment-claim'
import type { ApplicantStatus } from '@/types/applicant'

export type ApplicantOpsCapabilities = {
  apiBase: '/api/admin' | '/api/support'
  canEditNotes: boolean
  canEditStatus: boolean
  canResendCredentials: boolean
  canApproveProfile: boolean
}

export const ADMIN_APPLICANT_CAPABILITIES: ApplicantOpsCapabilities = {
  apiBase: '/api/admin',
  canEditNotes: true,
  canEditStatus: true,
  canResendCredentials: true,
  canApproveProfile: true,
}

interface ApplicantDetailProps {
  applicant: {
    id: string
    name: string | null
    email: string
    phone: string | null
    gender: string | null
    batch_slug: string | null
    date_choice: string | null
    status: ApplicantStatus
    quiz_score: number | null
    quiz_answers: Record<string, unknown> | null
    payment_plan: string | null
    amount_paid: number | null
    balance_due: number | null
    final_amount: number | null
    admin_notes: string | null
    created_at: string
    razorpay_payment_id: string | null
    kyc_status: string | null
    profile_completed_at: string | null
    match_insight?: Record<string, unknown> | null
    batches?: { name: string; slug: string } | { name: string; slug: string }[] | null
    promo_codes?: { code: string } | { code: string }[] | null
  }
  matchInsight?: Record<string, unknown> | null
  capabilities: ApplicantOpsCapabilities
}

const STATUS_OPTIONS: ApplicantStatus[] = [
  'pending',
  'deposit_paid',
  'paid',
  'approved',
  'rejected',
]

function relName<T extends { name?: string; code?: string }>(rel: T | T[] | null | undefined) {
  if (!rel) return null
  const row = Array.isArray(rel) ? rel[0] : rel
  return row?.name ?? row?.code ?? null
}

export default function ApplicantOpsDetail({
  applicant,
  matchInsight,
  capabilities,
}: ApplicantDetailProps) {
  const router = useRouter()
  const apiPrefix = `${capabilities.apiBase}/applicants/${applicant.id}`
  const [status, setStatus] = useState(applicant.status)
  const [notes, setNotes] = useState(applicant.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendResult, setResendResult] = useState<{
    email: string
    temporaryPassword: string
  } | null>(null)
  const [kycStatus, setKycStatus] = useState(applicant.kyc_status ?? 'pending')
  const [approvingProfile, setApprovingProfile] = useState(false)

  const save = async () => {
    if (!capabilities.canEditNotes && !capabilities.canEditStatus) return
    setSaving(true)
    setMessage(null)
    const body: Record<string, unknown> = {}
    if (capabilities.canEditStatus) body.status = status
    if (capabilities.canEditNotes) body.adminNotes = notes

    const res = await fetch(apiPrefix, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) {
      setMessage(json.error ?? 'Save failed')
    } else {
      setMessage('Saved')
      router.refresh()
    }
    setSaving(false)
  }

  const resendCredentials = async () => {
    if (!capabilities.canResendCredentials || !canResend) {
      setMessage('Cannot resend — applicant has not completed payment.')
      return
    }
    if (!confirm(`Resend member login credentials to ${applicant.email}? This resets their password.`)) {
      return
    }

    setResending(true)
    setMessage(null)
    setResendResult(null)

    const res = await fetch(`${apiPrefix}/resend-credentials`, { method: 'POST' })
    const json = await res.json()

    if (!res.ok) {
      setMessage(json.error ?? 'Resend failed')
    } else {
      setMessage(`Credentials emailed to ${json.email}`)
      setResendResult({
        email: json.email,
        temporaryPassword: json.temporaryPassword,
      })
    }
    setResending(false)
  }

  const profileComplete = isProfileComplete(applicant)
  const profileApproved = isProfileKycApproved(kycStatus)

  const approveProfile = async () => {
    if (!capabilities.canApproveProfile) return
    if (!profileComplete) {
      setMessage('Applicant has not submitted their profile yet.')
      return
    }
    if (profileApproved) return
    if (
      !confirm(
        `Approve profile for ${applicant.name || applicant.email}?\n\nThis unlocks balance payment in the member portal — the applicant then has 48 hours to pay the balance before the slot is released.`
      )
    ) {
      return
    }

    setApprovingProfile(true)
    setProfileMessage(null)

    const res = await fetch(`${apiPrefix}/approve-profile`, { method: 'POST' })
    const json = await res.json()

    if (!res.ok) {
      setProfileMessage(json.error ?? 'Could not approve profile')
    } else {
      setKycStatus(json.applicant?.kyc_status ?? 'approved')
      setProfileMessage('Profile approved — member has 48 hours to pay the balance before the slot is released.')
      router.refresh()
    }
    setApprovingProfile(false)
  }

  const batchName = relName(applicant.batches)
  const promoCode = relName(applicant.promo_codes)
  const insight = matchInsight ?? applicant.match_insight
  const paymentVerified = hasVerifiedPayment(applicant)
  const canResend = capabilities.canResendCredentials && canResendMemberCredentials(applicant)
  const canReview = capabilities.canEditNotes || capabilities.canEditStatus

  return (
    <div className="admin-stack">
      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-title">{applicant.name || applicant.email}</h2>
          <Badge color="teal">{status}</Badge>
        </div>

        <dl className="admin-dl">
          <div><dt>Email</dt><dd>{applicant.email}</dd></div>
          <div><dt>Phone</dt><dd>{applicant.phone || '—'}</dd></div>
          <div><dt>Gender</dt><dd>{applicant.gender === 'm' ? 'Male' : applicant.gender === 'f' ? 'Female' : '—'}</dd></div>
          <div><dt>Batch</dt><dd>{batchName || applicant.batch_slug || '—'}</dd></div>
          <div><dt>Date choice</dt><dd>{applicant.date_choice || '—'}</dd></div>
          <div><dt>Promo</dt><dd>{promoCode || '—'}</dd></div>
          <div><dt>Quiz score</dt><dd>{applicant.quiz_score ?? '—'}</dd></div>
          {applicant.quiz_answers &&
          (applicant.quiz_answers[0] != null || applicant.quiz_answers['0'] != null) ? (
            <div>
              <dt>Age (from quiz)</dt>
              <dd>{String(applicant.quiz_answers[0] ?? applicant.quiz_answers['0'])}</dd>
            </div>
          ) : null}
          <div><dt>Payment plan</dt><dd>{applicant.payment_plan || '—'}</dd></div>
          <div>
            <dt>Payment status</dt>
            <dd>{paymentVerified ? 'Paid via Razorpay' : 'Checkout not completed'}</dd>
          </div>
          <div><dt>Amount paid</dt><dd>{applicantAmountPaidLabel(applicant)}</dd></div>
          <div><dt>Balance due</dt><dd>{applicantBalanceDueLabel(applicant)}</dd></div>
          <div>
            <dt>Latest Razorpay payment</dt>
            <dd>{applicant.razorpay_payment_id || '—'}</dd>
          </div>
          <div><dt>Applied</dt><dd>{new Date(applicant.created_at).toLocaleString('en-IN')}</dd></div>
          <div>
            <dt>Profile / KYC</dt>
            <dd>{kycStatusLabel(kycStatus)}</dd>
          </div>
        </dl>
      </div>

      {capabilities.canApproveProfile && (
        <div className="admin-panel" id="profile-review">
          <h3 className="admin-panel-title">Profile review</h3>
          {!profileComplete ? (
            <p className="account-muted">
              Waiting for the member to complete the compatibility quiz, batch, and departure date in
              the portal.
            </p>
          ) : profileApproved ? (
            <>
              <p className="admin-msg">Profile approved — balance payment is open in the member portal.</p>
              <p className="admin-muted" style={{ fontSize: 13 }}>
                They have 48 hours from approval to pay the remaining balance before the slot is
                released (50% of the deposit refunded). Use the payments panel above to copy the link
                or email a reminder.
              </p>
            </>
          ) : (
            <>
              <p className="account-muted" style={{ marginBottom: 12 }}>
                Profile submitted ({kycStatusLabel(kycStatus)}). Review quiz answers and match insight,
                then approve to unlock balance payment.
              </p>
              <button
                type="button"
                className="admin-btn"
                disabled={approvingProfile}
                onClick={approveProfile}
              >
                {approvingProfile ? 'Approving…' : 'Approve profile'}
              </button>
            </>
          )}
          {profileMessage && (
            <p className={`admin-msg${profileMessage.includes('approved') ? '' : ' apply-error'}`} style={{ marginTop: 12 }}>
              {profileMessage}
            </p>
          )}
        </div>
      )}

      <div className="admin-panel" id="member-portal">
        <h3 className="admin-panel-title">Member portal</h3>
        {canResend ? (
          <>
            <p className="account-muted" style={{ marginBottom: 12 }}>
              This applicant can log in at{' '}
              <a href="/account/login" className="admin-inline-link" target="_blank" rel="noreferrer">
                togetha.club/account/login
              </a>{' '}
              with their quiz/apply email.
            </p>
            <button
              type="button"
              className="admin-btn"
              disabled={resending}
              onClick={resendCredentials}
            >
              {resending ? 'Sending…' : 'Resend member credentials'}
            </button>
            <p className="admin-muted" style={{ marginTop: 8, fontSize: 13 }}>
              Generates a new temporary password and emails login instructions. The temp password also
              appears here for phone support.
            </p>
            {resendResult && (
              <p className="admin-msg" style={{ marginTop: 8 }}>
                Sent to <strong>{resendResult.email}</strong> — temp password:{' '}
                <strong>{resendResult.temporaryPassword}</strong>
              </p>
            )}
          </>
        ) : (
          <p className="account-muted">
            {capabilities.canResendCredentials
              ? 'Available after the applicant completes payment (status deposit_paid or paid). Quiz-only leads will not show this action.'
              : 'You do not have permission to resend credentials.'}
          </p>
        )}
        {message && <p className="admin-msg" style={{ marginTop: 12 }}>{message}</p>}
      </div>

      {insight && (
        <div className="admin-panel">
          <h3 className="admin-panel-title">AI match review</h3>
          <dl className="admin-dl">
            <div>
              <dt>Batch fit</dt>
              <dd>{insight.matchScore != null ? `${insight.matchScore}%` : '—'}</dd>
            </div>
            <div>
              <dt>Placement chance</dt>
              <dd>{insight.placementChance != null ? `${insight.placementChance}%` : '—'}</dd>
            </div>
            <div>
              <dt>Cohort overlap</dt>
              <dd>
                {insight.cohortMatchPercent != null
                  ? `${insight.cohortMatchPercent}%${
                      insight.cohortSampleSize ? ` · ${insight.cohortSampleSize} applicants` : ''
                    }`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Strong mutual fits</dt>
              <dd>
                {insight.cohortStrongMatchPercent != null
                  ? `${insight.cohortStrongMatchPercent}%`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{String(insight.confidence ?? '—')}</dd>
            </div>
          </dl>
          {insight.aiNarrative ? (
            <p className="admin-match-narrative">{String(insight.aiNarrative)}</p>
          ) : null}
          {Array.isArray(insight.peerMix) && insight.peerMix.length > 0 ? (
            <div className="admin-match-peers">
              <strong>Likely peer mix</strong>
              {(insight.peerMix as { label: string; percent: number }[]).slice(0, 4).map((peer) => (
                <div key={peer.label} className="admin-match-peer-row">
                  <span>{peer.label}</span>
                  <span>{peer.percent}%</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {canReview && (
        <div className="admin-panel">
          <h3 className="admin-panel-title">Review</h3>
          {capabilities.canEditStatus && (
            <label className="admin-field">
              <span>Status</span>
              <select
                className="apply-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicantStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          )}
          {capabilities.canEditNotes && (
            <label className="admin-field">
              <span>Internal notes</span>
              <textarea
                className="apply-input admin-textarea"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ops notes — not visible to applicant"
              />
            </label>
          )}
          {message && <p className="admin-msg">{message}</p>}
          <button type="button" className="admin-btn" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save review'}
          </button>
        </div>
      )}

      {applicant.quiz_answers && (
        <div className="admin-panel">
          <h3 className="admin-panel-title">Quiz answers</h3>
          <pre className="admin-pre">{JSON.stringify(applicant.quiz_answers, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
