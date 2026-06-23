'use client'

import { useState } from 'react'
import { formatPaise } from '@/lib/utils'
import type { ApplicantPaymentKind } from '@/lib/applicant-payments'

export interface AdminPaymentRow {
  id: string
  razorpay_payment_id: string
  razorpay_order_id: string | null
  payment_kind: ApplicantPaymentKind
  amount_paise: number
  captured_at: string
}

interface AdminApplicantPaymentsProps {
  applicantId: string
  applicantEmail: string
  balanceDue: number | null
  status: string
  payments: AdminPaymentRow[]
  totalPaidPaise: number
  payUrl: string
}

const KIND_LABELS: Record<ApplicantPaymentKind, string> = {
  deposit: 'Slot booking (deposit)',
  full: 'Paid in full',
  balance: 'Balance payment',
  claim: 'Payment linked',
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminApplicantPayments({
  applicantId,
  applicantEmail,
  balanceDue,
  status,
  payments,
  totalPaidPaise,
  payUrl,
}: AdminApplicantPaymentsProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)

  const balance = balanceDue ?? 0
  const canSendBalanceLink = status === 'deposit_paid' && balance > 0

  const copyPayLink = async () => {
    try {
      await navigator.clipboard.writeText(payUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMessage('Could not copy — select the link manually.')
    }
  }

  const sendBalanceEmail = async () => {
    if (!canSendBalanceLink) return
    if (
      !confirm(
        `Email balance payment link to ${applicantEmail}?\n\nBalance due: ${formatPaise(balance)}`
      )
    ) {
      return
    }

    setSending(true)
    setMessage(null)

    const res = await fetch(`/api/admin/applicants/${applicantId}/send-balance-link`, {
      method: 'POST',
    })
    const json = await res.json()

    if (!res.ok) {
      setMessage(json.error ?? 'Could not send email')
    } else {
      setMessage(`Balance payment email sent to ${json.email}`)
    }
    setSending(false)
  }

  return (
    <div className="admin-panel">
      <h3 className="admin-panel-title">Payment receipts</h3>
      <p className="account-muted" style={{ marginBottom: 12 }}>
        Each Razorpay <code>pay_</code> ID is logged separately — deposit first, then balance when
        paid.
      </p>

      {payments.length === 0 ? (
        <p className="account-muted">No payments recorded yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Receipt ID</th>
                <th>Order ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((row) => (
                <tr key={row.id}>
                  <td>{formatWhen(row.captured_at)}</td>
                  <td>{KIND_LABELS[row.payment_kind] ?? row.payment_kind}</td>
                  <td>{formatPaise(row.amount_paise)}</td>
                  <td>
                    <code className="admin-code">{row.razorpay_payment_id}</code>
                  </td>
                  <td>
                    {row.razorpay_order_id ? (
                      <code className="admin-code">{row.razorpay_order_id}</code>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dl className="admin-dl" style={{ marginTop: 16 }}>
        <div>
          <dt>Total recorded</dt>
          <dd>{formatPaise(totalPaidPaise)} · {payments.length} payment(s)</dd>
        </div>
        {balance > 0 && (
          <div>
            <dt>Balance due</dt>
            <dd className="account-balance">{formatPaise(balance)}</dd>
          </div>
        )}
      </dl>

      {canSendBalanceLink && (
        <div className="admin-credentials-inline" style={{ marginTop: 16 }}>
          <p className="account-muted" style={{ marginBottom: 10 }}>
            Member portal link (log in → pay remaining balance):
          </p>
          <p className="admin-code" style={{ wordBreak: 'break-all', marginBottom: 12 }}>
            {payUrl}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="admin-btn" onClick={copyPayLink}>
              {copied ? 'Copied ✓' : 'Copy payment link'}
            </button>
            <button
              type="button"
              className="admin-btn"
              disabled={sending}
              onClick={sendBalanceEmail}
            >
              {sending ? 'Sending…' : 'Email balance payment link'}
            </button>
          </div>
          <p className="admin-muted" style={{ marginTop: 8, fontSize: 13 }}>
            Email includes amount due, departure context, and a button to the member portal.
          </p>
        </div>
      )}

      {message && <p className="admin-msg" style={{ marginTop: 12 }}>{message}</p>}
    </div>
  )
}
