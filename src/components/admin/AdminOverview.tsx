'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { formatPaise } from '@/lib/utils'

export default function AdminOverview() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch('/api/admin/overview')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  if (loading) return <p className="account-muted">Loading…</p>
  if (!data) return <p className="apply-error">Could not load overview.</p>

  const chart = (data.bookingsChart as { date: string; count: number }[]) ?? []
  const max = Math.max(...chart.map((c) => c.count), 1)

  return (
    <div className="account-stack">
      <div className="portal-kpi-grid">
        {[
          ['Total creators', data.totalCreators],
          ['Active creators', data.activeCreators],
          ['Total bookings', data.totalBookings],
          ['Commissions paid', formatPaise(data.totalCommissionsPaidPaise as number)],
          ['Content pending', data.pendingContentReviews],
          ['Pending applications', data.pendingApplications],
        ].map(([label, val]) => (
          <div key={String(label)} className="admin-stat">
            <div className="admin-stat-num">{val as string | number}</div>
            <div className="admin-stat-label">{label as string}</div>
          </div>
        ))}
      </div>

      <div className="portal-two-col">
        <div className="account-panel">
          <h2 className="account-panel-title">Alerts</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {((data.alerts as Record<string, unknown>)?.overdueContent as unknown[])?.map((a: unknown) => {
              const row = a as Record<string, unknown>
              const inf = row.influencers as { name: string } | { name: string }[]
              const name = Array.isArray(inf) ? inf[0]?.name : inf?.name
              return (
                <li key={String(row.id)} style={{ marginBottom: 8 }}>
                  {name} — overdue content · <Link href={ROUTES.adminContent}>Review</Link>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="account-panel">
          <h2 className="account-panel-title">Quick actions</h2>
          <p><Link href={ROUTES.admin}>Review applications</Link></p>
          <p><Link href={ROUTES.adminContent}>Review content</Link></p>
          <p><Link href={ROUTES.adminPayouts}>Process payouts</Link></p>
          <p><Link href={ROUTES.adminBatches}>Add a batch</Link></p>
        </div>
      </div>

      <div className="account-panel">
        <h2 className="account-panel-title">Bookings (14 days)</h2>
        <div className="portal-chart">
          {chart.map((c) => (
            <div key={c.date} className="portal-chart-bar-wrap">
              <span className="portal-chart-val">{c.count}</span>
              <div className="portal-chart-bar" style={{ height: `${Math.max(8, (c.count / max) * 100)}px` }} />
              <span className="portal-chart-label">{c.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
