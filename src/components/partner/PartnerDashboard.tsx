'use client'

import { useEffect, useState } from 'react'
import { ROUTES } from '@/constants/routes'
import { formatPaise } from '@/lib/utils'

interface PartnerData {
  influencer: { name: string; email: string | null; payoutUpi: string | null }
  stats: {
    totalCodes: number
    totalRedemptions: number
    pendingCommissionPaise: number
    approvedCommissionPaise: number
    paidOutCommissionPaise: number
  }
  promoCodes: {
    id: string
    code: string
    usesCount: number
    maxUses: number | null
    active: boolean
    commissionAmount: number
    shareUrl: string
  }[]
  redemptions: {
    id: string
    promoCode: string
    applicantName: string
    batchSlug: string
    commissionAmount: number
    status: string
    paidAt: string
  }[]
}

export default function PartnerDashboard() {
  const [data, setData] = useState<PartnerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/partner/me')
      .then((r) => r.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false))
  }, [])

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setMsg('Link copied!')
  }

  if (loading) return <p className="account-muted">Loading…</p>
  if (!data?.influencer) return <p className="account-muted">Could not load partner data.</p>

  return (
    <div className="account-stack">
      <div className="account-panel">
        <p className="apply-eyebrow">✦ Partner ✦</p>
        <h1 className="account-title">{data.influencer.name}</h1>
        <p className="account-sub">{data.influencer.email}</p>
        {msg && <p className="account-msg">{msg}</p>}
      </div>

      <div className="admin-stat-grid">
        <div className="admin-stat">
          <div className="admin-stat-num">{data.stats.totalCodes}</div>
          <div className="admin-stat-label">Promo codes</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{data.stats.totalRedemptions}</div>
          <div className="admin-stat-label">Conversions</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{formatPaise(data.stats.pendingCommissionPaise)}</div>
          <div className="admin-stat-label">Pending</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{formatPaise(data.stats.paidOutCommissionPaise)}</div>
          <div className="admin-stat-label">Paid out</div>
        </div>
      </div>

      <div className="account-panel">
        <h2 className="account-panel-title">Your promo codes</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Uses</th>
                <th>Commission</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {data.promoCodes.map((p) => (
                <tr key={p.id}>
                  <td>
                    <code className="admin-code">{p.code}</code>
                  </td>
                  <td>
                    {p.usesCount}
                    {p.maxUses ? ` / ${p.maxUses}` : ''}
                  </td>
                  <td>{formatPaise(p.commissionAmount)}</td>
                  <td>
                    <button type="button" className="admin-link-btn" onClick={() => copyLink(p.shareUrl)}>
                      Copy link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="account-panel">
        <h2 className="account-panel-title">Earnings ledger</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Applicant</th>
                <th>Batch</th>
                <th>Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.redemptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    No conversions yet — share your link!
                  </td>
                </tr>
              ) : (
                data.redemptions.map((r) => (
                  <tr key={r.id}>
                    <td>{r.promoCode}</td>
                    <td>{r.applicantName}</td>
                    <td>{r.batchSlug}</td>
                    <td>{formatPaise(r.commissionAmount)}</td>
                    <td>{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
