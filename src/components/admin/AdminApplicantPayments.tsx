'use client'

import { useEffect, useState } from 'react'
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
  amountPaid: number | null
  paymentPlan: string | null
  status: string
  payments: AdminPaymentRow[]
  totalPaidPaise: number
  payUrl: string
  apiBase?: '/api/admin' | '/api/support'
  canSendBalanceLink?: boolean
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
  amountPaid,
  paymentPlan,
  status,
  payments,
  totalPaidPaise,
  payUrl,
  apiBase = '/api/admin',
  canSendBalanceLink = true,
}: AdminApplicantPaymentsProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [preview, setPreview] = useState<{
    formatted: {
      original: string | null
      final: string | null
      discount: string | null
      paid: string
      balance: string
    }
    canSend: boolean
    validationError: string | null
    emailPreview: { subject: string; text: string }
  } | null>(null)

  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(true)

  useEffect(() => {
    setPreviewLoading(true)
    setPreviewError(null)
    fetch(`${apiBase}/applicants/${applicantId}/send-balance-link`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setPreview(null)
          setPreviewError(json.error)
          return
        }
        if (json.amounts?.formatted) {
          setPreview({
            formatted: json.amounts.formatted,
            canSend: Boolean(json.canSend),
            validationError: json.validationError ?? null,
            emailPreview: json.emailPreview ?? { subject: '', text: '' },
          })
        }
      })
      .catch(() => {
        setPreviewError('Could not load balance email preview.')
      })
      .finally(() => {
        setPreviewLoading(false)
      })
  }, [applicantId, apiBase])

  const balance = balanceDue ?? 0
  const paid = amountPaid ?? 0
  const isDepositBooking =
    paymentPlan === 'deposit' ||
    status === 'deposit_paid' ||
    payments.some((row) => row.payment_kind === 'deposit')
  const showBalanceTools =
    isDepositBooking || balance > 0 || paid > 0 || payments.length > 0

  const sendBlockReason = (() => {
    if (status !== 'deposit_paid') {
      return `Status is "${status}" — set to deposit_paid to send a balance reminder.`
    }
    if (balance <= 0) {
      return 'balance_due is zero on this row — nothing left to collect.'
    }
    if (preview?.validationError) return preview.validationError
    if (preview && !preview.canSend) {
      return 'Booking amounts failed validation — fix totals in Supabase first.'
    }
    return null
  })()

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
    if (sendBlockReason) {
      setMessage(sendBlockReason)
      return
    }
    if (
      !confirm(
        `Email balance payment link to ${applicantEmail}?\n\nBalance due (from DB): ${preview?.formatted.balance ?? formatPaise(balance)}`
      )
    ) {
      return
    }

    setSending(true)
    setMessage(null)

    const res = await fetch(`${apiBase}/applicants/${applicantId}/send-balance-link`, {
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
    <div className="admin-panel" id="payments">
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

      {showBalanceTools && (
        <div className="admin-credentials-inline" id="balance-email" style={{ marginTop: 16 }}>
          <h4 className="admin-panel-title" style={{ fontSize: '1rem', marginBottom: 8 }}>
            Balance payment reminder
          </h4>
          {previewLoading && (
            <p className="account-muted" style={{ marginBottom: 12 }}>
              Loading email preview from database…
            </p>
          )}
          {previewError && !previewLoading && (
            <p className="apply-error" style={{ marginBottom: 12 }}>
              {previewError}
            </p>
          )}
          {preview && (
            <div className="admin-panel" style={{ marginBottom: 16, padding: 12, background: 'var(--cream)' }}>
              <strong>Email preview — amounts from database</strong>
              <dl className="admin-dl" style={{ marginTop: 8 }}>
                {preview.formatted.original && (
                  <div>
                    <dt>List price</dt>
                    <dd>{preview.formatted.original}</dd>
                  </div>
                )}
                {preview.formatted.discount && (
                  <div>
                    <dt>Discount</dt>
                    <dd>−{preview.formatted.discount}</dd>
                  </div>
                )}
                {preview.formatted.final && (
                  <div>
                    <dt>Trip total</dt>
                    <dd>{preview.formatted.final}</dd>
                  </div>
                )}
                <div>
                  <dt>Paid so far</dt>
                  <dd>{preview.formatted.paid}</dd>
                </div>
                <div>
                  <dt>Balance due</dt>
                  <dd>{preview.formatted.balance}</dd>
                </div>
              </dl>
              {preview.validationError && (
                <p className="apply-error" style={{ marginTop: 8 }}>
                  {preview.validationError}
                </p>
              )}
              <p className="admin-muted" style={{ marginTop: 8, fontSize: 13, whiteSpace: 'pre-wrap' }}>
                <strong>Subject:</strong> {preview.emailPreview.subject}
                {'\n\n'}
                {preview.emailPreview.text}
              </p>
            </div>
          )}
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
              disabled={sending || previewLoading || Boolean(sendBlockReason) || !canSendBalanceLink}
              onClick={sendBalanceEmail}
            >
              {sending ? 'Sending…' : 'Email balance payment link'}
            </button>
          </div>
          {sendBlockReason ? (
            <p className="apply-error" style={{ marginTop: 8, fontSize: 13 }}>
              {sendBlockReason}
            </p>
          ) : (
            <p className="admin-muted" style={{ marginTop: 8, fontSize: 13 }}>
              Sends to <strong>{applicantEmail}</strong> with amount due, departure context, and a
              button to the member portal.
            </p>
          )}
        </div>
      )}

      {message && <p className="admin-msg" style={{ marginTop: 12 }}>{message}</p>}
    </div>
  )
}
