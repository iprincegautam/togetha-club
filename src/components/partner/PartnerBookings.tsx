'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { formatPaise } from '@/lib/utils'
import { hoursUntilConfirm } from '@/lib/partner-portal'

type Booking = {
  id: string
  promoCode: string
  applicantName: string
  batchSlug: string
  commissionAmount: number
  status: string
  createdAt: string
}

const TABS = ['all', 'pending', 'approved', 'paid_out', 'cancelled'] as const

export default function PartnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number]>('all')
  const [batchFilter, setBatchFilter] = useState('all')

  useEffect(() => {
    fetch('/api/partner/me?view=bookings')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setBookings(json.bookings ?? [])
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Load failed'))
      .finally(() => setLoading(false))
  }, [])

  const batches = useMemo(() => {
    const s = new Set(bookings.map((b) => b.batchSlug))
    return Array.from(s)
  }, [bookings])

  const filtered = bookings.filter((b) => {
    if (tab !== 'all' && b.status !== tab && !(tab === 'paid_out' && b.status === 'paid')) {
      return false
    }
    if (batchFilter !== 'all' && b.batchSlug !== batchFilter) return false
    return true
  })

  const sums = useMemo(() => {
    let confirmed = 0
    let confirmedAmt = 0
    let pendingAmt = 0
    let reversed = 0
    for (const b of bookings) {
      if (b.status === 'approved' || b.status === 'paid_out' || b.status === 'paid') {
        confirmed++
        confirmedAmt += b.commissionAmount
      }
      if (b.status === 'pending') pendingAmt += b.commissionAmount
      if (b.status === 'cancelled') reversed += b.commissionAmount
    }
    return { confirmed, confirmedAmt, pendingAmt, reversed }
  }, [bookings])

  if (loading) return <p className="account-muted">Loading…</p>
  if (error) return <p className="apply-error">{error}</p>

  return (
    <div className="account-stack">
      <div className="account-panel">
        <h1 className="account-title">Bookings</h1>
        <div className="portal-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`portal-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'all' ? 'All' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
        <select
          className="apply-input"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          style={{ maxWidth: 240, marginBottom: 16 }}
        >
          <option value="all">All batches</option>
          {batches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Traveler</th>
                <th>Batch</th>
                <th>Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    No bookings yet. <Link href={ROUTES.partner}>Share your link</Link> to start earning.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id}>
                    <td>{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>{b.applicantName}</td>
                    <td>{b.batchSlug}</td>
                    <td style={b.status === 'cancelled' ? { color: 'var(--rose)' } : undefined}>
                      {b.status === 'cancelled' ? '₹0' : formatPaise(b.commissionAmount)}
                    </td>
                    <td>
                      {b.status === 'pending'
                        ? `Confirms in ${hoursUntilConfirm(b.createdAt)}h`
                        : b.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="account-muted" style={{ marginTop: 12 }}>
          Confirmed: {sums.confirmed} · Confirmed commission: {formatPaise(sums.confirmedAmt)} ·
          Pending: {formatPaise(sums.pendingAmt)} · Reversed: {formatPaise(sums.reversed)}
        </p>
      </div>
    </div>
  )
}
