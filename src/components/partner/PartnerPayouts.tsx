'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { formatPaise } from '@/lib/utils'
import {
  TDS_194J_THRESHOLD,
  TDS_194R_THRESHOLD,
  formatInrAmount,
} from '@/lib/partner-portal'

export default function PartnerPayouts() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/partner/payouts')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="account-muted">Loading…</p>
  if (!data) return <p className="apply-error">Could not load payouts.</p>

  const queued = (data.queuedPaise as number) ?? 0
  const tds = (data.tdsPaise as number) ?? 0
  const net = (data.netPaise as number) ?? 0
  const cash = Number(data.cashPayoutsThisYear ?? 0)
  const tripFmv = Number(data.tripFmvThisYear ?? 0)
  const history = (data.history as Array<Record<string, unknown>>) ?? []
  const nextDate = data.nextPayoutDate
    ? new Date(data.nextPayoutDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
    : '10th of next month'

  const barPct = (val: number, max: number) => Math.min(100, (val / max) * 100)
  const barClass = (pct: number) => (pct >= 100 ? 'danger' : pct >= 80 ? 'warn' : '')

  return (
    <div className="account-stack">
      <div className="portal-banner portal-banner--blue">
        Next payout processes on {nextDate}. {formatPaise(queued)} queued.
        {tds > 0 && ` TDS ${formatPaise(tds)} · Net ${formatPaise(net)}`}
      </div>

      <div className="account-panel">
        <h1 className="account-title">Payout history</h1>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Bookings</th>
                <th>Gross</th>
                <th>TDS</th>
                <th>Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty">
                    No payout history yet.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={String(h.month)}>
                    <td>{h.month as string}</td>
                    <td>{h.bookings as number}</td>
                    <td>{formatPaise(h.grossPaise as number)}</td>
                    <td>{formatPaise(h.tdsPaise as number)}</td>
                    <td>{formatPaise(h.netPaise as number)}</td>
                    <td>{h.status as string}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="account-panel">
        <h2 className="account-panel-title">TDS tracker</h2>
        <p>194J (cash): {formatInrAmount(cash)} of {formatInrAmount(TDS_194J_THRESHOLD)}</p>
        <div className="portal-progress">
          <div
            className={`portal-progress-fill ${barClass(barPct(cash, TDS_194J_THRESHOLD))}`}
            style={{ width: `${barPct(cash, TDS_194J_THRESHOLD)}%` }}
          />
        </div>
        <p style={{ marginTop: 16 }}>194R (trips): {formatInrAmount(tripFmv)} of {formatInrAmount(TDS_194R_THRESHOLD)}</p>
        <div className="portal-progress">
          <div
            className={`portal-progress-fill ${barClass(barPct(tripFmv, TDS_194R_THRESHOLD))}`}
            style={{ width: `${barPct(tripFmv, TDS_194R_THRESHOLD)}%` }}
          />
        </div>
        <p style={{ marginTop: 16 }}>
          <Link href={ROUTES.partnerProfile}>Update bank details →</Link>
        </p>
      </div>
    </div>
  )
}
