'use client'

import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'

interface InfluencerStat {
  id: string
  name: string
  email: string | null
  status: string
  paidBookings: number
  totalCommissionPaise: number
}

interface PromoRow {
  id: string
  code: string
  influencerName: string
  discountType: string
  discountValue: number
  commissionAmount: number
  grantsPriority: boolean
  usesCount: number
  maxUses: number | null
  active: boolean
}

interface RedemptionRow {
  id: string
  applicantName: string
  batchSlug: string
  promoCode: string
  influencerName: string
  discountAmount: number
  commissionAmount: number
  paidAt: string
}

function formatDiscount(type: string, value: number) {
  if (type === 'percent') return `${value}% off`
  return `₹${value.toLocaleString('en-IN')} off`
}

export default function AdminAffiliatesDashboard() {
  const [influencers, setInfluencers] = useState<InfluencerStat[]>([])
  const [promoCodes, setPromoCodes] = useState<PromoRow[]>([])
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/affiliates')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setInfluencers(data.influencerStats ?? [])
        setPromoCodes(data.promoCodes ?? [])
        setRedemptions(data.redemptions ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="admin-loading">Loading affiliate data...</p>
  }

  if (error) {
    return <p className="apply-error">{error}</p>
  }

  return (
    <div className="admin-affiliates">
      <div className="admin-stat-grid">
        <div className="admin-stat">
          <div className="admin-stat-num">{influencers.length}</div>
          <div className="admin-stat-label">Influencers</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{promoCodes.length}</div>
          <div className="admin-stat-label">Promo codes</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{redemptions.length}</div>
          <div className="admin-stat-label">Paid redemptions</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">
            {formatPrice(
              influencers.reduce((s, i) => s + i.totalCommissionPaise, 0) / 100
            )}
          </div>
          <div className="admin-stat-label">Total commission owed</div>
        </div>
      </div>

      <section className="admin-section">
        <h2 className="admin-section-title">Influencers</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Paid bookings</th>
                <th>Commission owed</th>
              </tr>
            </thead>
            <tbody>
              {influencers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    No influencers yet. Run migration 002 or add via Supabase.
                  </td>
                </tr>
              ) : (
                influencers.map((inf) => (
                  <tr key={inf.id}>
                    <td>{inf.name}</td>
                    <td>{inf.email ?? '—'}</td>
                    <td>{inf.status}</td>
                    <td>{inf.paidBookings}</td>
                    <td>{formatPrice(inf.totalCommissionPaise / 100)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Promo codes</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Influencer</th>
                <th>Discount</th>
                <th>Commission</th>
                <th>Uses</th>
                <th>Priority</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty">
                    No promo codes yet.
                  </td>
                </tr>
              ) : (
                promoCodes.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <code className="admin-code">{p.code}</code>
                    </td>
                    <td>{p.influencerName}</td>
                    <td>{formatDiscount(p.discountType, p.discountValue)}</td>
                    <td>{formatPrice(p.commissionAmount / 100)}</td>
                    <td>
                      {p.usesCount}
                      {p.maxUses !== null ? ` / ${p.maxUses}` : ''}
                    </td>
                    <td>{p.grantsPriority ? 'Yes' : '—'}</td>
                    <td>{p.active ? 'Yes' : 'No'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Recent redemptions</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Batch</th>
                <th>Code</th>
                <th>Influencer</th>
                <th>Discount</th>
                <th>Commission</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty">
                    No paid redemptions yet.
                  </td>
                </tr>
              ) : (
                redemptions.map((r) => (
                  <tr key={r.id}>
                    <td>{r.applicantName}</td>
                    <td>{r.batchSlug}</td>
                    <td>
                      <code className="admin-code">{r.promoCode}</code>
                    </td>
                    <td>{r.influencerName}</td>
                    <td>{formatPrice(r.discountAmount / 100)}</td>
                    <td>{formatPrice(r.commissionAmount / 100)}</td>
                    <td>
                      {new Date(r.paidAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
