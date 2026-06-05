'use client'

import { useEffect, useState } from 'react'
import { formatPaise } from '@/lib/utils'

type Props = { id: string }

const TABS = ['overview', 'bookings', 'content', 'trips', 'tds', 'notifications'] as const

export default function AdminCreatorDetail({ id }: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('overview')
  const [data, setData] = useState<Record<string, unknown> | null>(null)

  const load = () => {
    fetch(`/api/admin/influencers/${id}/detail`).then((r) => r.json()).then(setData)
  }

  useEffect(() => {
    load()
  }, [id])

  if (!data?.influencer) return <p className="account-muted">Loading…</p>

  const inf = data.influencer as Record<string, unknown>

  const patch = async (updates: Record<string, unknown>) => {
    await fetch(`/api/admin/influencers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    load()
  }

  return (
    <div className="account-stack">
      <h1 className="account-title">{String(inf.name)}</h1>
      <div className="portal-tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={`portal-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="account-panel">
          <p>Status: {String(inf.status)}</p>
          <p>MOU: {inf.mou_signed ? 'Signed' : 'Pending'}</p>
          <p>PAN: {inf.pan_verified ? 'Verified' : inf.pan_doc_url ? 'Submitted' : 'Missing'}</p>
          {inf.pan_doc_url != null && !inf.pan_verified ? (
            <>
              <a href={String(inf.pan_doc_url)} target="_blank" rel="noreferrer">
                View PAN doc
              </a>
              <button type="button" className="apply-submit" style={{ marginTop: 8 }} onClick={() => patch({ panVerified: true })}>
                Verify PAN
              </button>
            </>
          ) : null}
          <select
            className="apply-input"
            style={{ marginTop: 12 }}
            value={String(inf.status)}
            onChange={(e) => patch({ status: e.target.value })}
          >
            {['applied', 'approved', 'signed', 'active', 'inactive', 'rejected'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <tbody>
              {((data.redemptions as Record<string, unknown>[]) ?? []).map((r) => (
                <tr key={String(r.id)}>
                  <td>{String(r.status)}</td>
                  <td>{formatPaise(r.commission_amount as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'tds' && (
        <div className="account-panel">
          <p>Cash payouts YTD: ₹{Number(inf.cash_payouts_this_year)}</p>
          <p>Trip FMV YTD: ₹{Number(inf.trip_fmv_this_year)}</p>
        </div>
      )}
    </div>
  )
}
