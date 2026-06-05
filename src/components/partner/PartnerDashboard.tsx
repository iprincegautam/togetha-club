'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { buildPartnerShareUrl } from '@/lib/partner-share'
import { copyTextToClipboard, formatPaise } from '@/lib/utils'
import PartnerOnboardingBanners from '@/components/partner/PartnerOnboardingBanners'
import PartnerCommissionChart from '@/components/partner/PartnerCommissionChart'

interface PartnerData {
  influencer: {
    name: string
    email: string | null
    payoutUpi: string | null
    mouSigned?: boolean
    panVerified?: boolean
    panDocUrl?: string | null
    cashPayoutsThisYear?: number
    tripFmvThisYear?: number
  }
  monthlyCommissions?: { label: string; amountPaise: number }[]
  recentRedemptions?: {
    id: string
    applicantName: string
    batchSlug: string
    commissionAmount: number
    status: string
    createdAt?: string
  }[]
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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/partner/me')
      .then((r) => r.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!copiedId) return
    const timer = window.setTimeout(() => setCopiedId(null), 2500)
    return () => window.clearTimeout(timer)
  }, [copiedId])

  const shareUrlFor = (code: string) =>
    typeof window !== 'undefined'
      ? buildPartnerShareUrl(code, window.location.origin)
      : buildPartnerShareUrl(code)

  const copyLink = async (code: string, id: string) => {
    setCopyError(null)
    try {
      await copyTextToClipboard(shareUrlFor(code))
      setCopiedId(id)
    } catch {
      setCopyError('Could not copy automatically — tap the link below to select it.')
    }
  }

  if (loading) return <p className="account-muted">Loading…</p>
  if (!data?.influencer) return <p className="account-muted">Could not load partner data.</p>

  const inf = data.influencer

  return (
    <div className="account-stack">
      <PartnerOnboardingBanners
        mouSigned={Boolean(inf.mouSigned)}
        panVerified={Boolean(inf.panVerified)}
        panDocUrl={inf.panDocUrl ?? null}
        cashPayoutsThisYear={inf.cashPayoutsThisYear ?? 0}
        tripFmvThisYear={inf.tripFmvThisYear ?? 0}
      />

      <div className="account-panel">
        <p className="apply-eyebrow">✦ Partner ✦</p>
        <h1 className="account-title">{data.influencer.name}</h1>
        <p className="account-sub">{data.influencer.email}</p>
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

      {data.monthlyCommissions && data.monthlyCommissions.length > 0 && (
        <div className="account-panel">
          <h2 className="account-panel-title">Commission trend</h2>
          <PartnerCommissionChart months={data.monthlyCommissions} />
        </div>
      )}

      {data.recentRedemptions && data.recentRedemptions.length > 0 && (
        <div className="account-panel">
          <h2 className="account-panel-title">
            Recent bookings{' '}
            <Link href={ROUTES.partnerBookings} className="admin-link-btn" style={{ fontSize: '0.85rem' }}>
              View all →
            </Link>
          </h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Traveler</th>
                  <th>Batch</th>
                  <th>Commission</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRedemptions.map((r) => (
                  <tr key={r.id}>
                    <td>{r.applicantName}</td>
                    <td>{r.batchSlug}</td>
                    <td>{formatPaise(r.commissionAmount)}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="account-panel">
        <h2 className="account-panel-title">Your promo codes</h2>
        {copyError && <p className="apply-error">{copyError}</p>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Uses</th>
                <th>Commission</th>
                <th>Share link</th>
              </tr>
            </thead>
            <tbody>
              {data.promoCodes.map((p) => {
                const shareUrl = shareUrlFor(p.code)
                const copied = copiedId === p.id
                return (
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
                      <div className="portal-share-cell">
                        <button
                          type="button"
                          className={`portal-copy-btn${copied ? ' copied' : ''}`}
                          onClick={() => copyLink(p.code, p.id)}
                          aria-live="polite"
                        >
                          {copied ? '✓ Link copied!' : 'Copy link'}
                        </button>
                        <a href={shareUrl} className="portal-share-url" target="_blank" rel="noreferrer">
                          {shareUrl}
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
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
