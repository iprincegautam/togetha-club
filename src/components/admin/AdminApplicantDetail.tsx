'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import type { ApplicantStatus } from '@/types/applicant'

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
    batches?: { name: string; slug: string } | { name: string; slug: string }[] | null
    promo_codes?: { code: string } | { code: string }[] | null
  }
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

export default function AdminApplicantDetail({ applicant }: ApplicantDetailProps) {
  const router = useRouter()
  const [status, setStatus] = useState(applicant.status)
  const [notes, setNotes] = useState(applicant.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setMessage(null)
    const res = await fetch(`/api/admin/applicants/${applicant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes: notes }),
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

  const batchName = relName(applicant.batches)
  const promoCode = relName(applicant.promo_codes)

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
          <div><dt>Payment plan</dt><dd>{applicant.payment_plan || '—'}</dd></div>
          <div><dt>Amount paid</dt><dd>{applicant.amount_paid != null ? `₹${(applicant.amount_paid / 100).toLocaleString('en-IN')}` : '—'}</dd></div>
          <div><dt>Balance due</dt><dd>{applicant.balance_due != null ? `₹${(applicant.balance_due / 100).toLocaleString('en-IN')}` : '—'}</dd></div>
          <div><dt>Razorpay payment</dt><dd>{applicant.razorpay_payment_id || '—'}</dd></div>
          <div><dt>Applied</dt><dd>{new Date(applicant.created_at).toLocaleString('en-IN')}</dd></div>
        </dl>
      </div>

      <div className="admin-panel">
        <h3 className="admin-panel-title">Review</h3>
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
        {message && <p className="admin-msg">{message}</p>}
        <button type="button" className="admin-btn" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save review'}
        </button>
      </div>

      {applicant.quiz_answers && (
        <div className="admin-panel">
          <h3 className="admin-panel-title">Quiz answers</h3>
          <pre className="admin-pre">{JSON.stringify(applicant.quiz_answers, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
