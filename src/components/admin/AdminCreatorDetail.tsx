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

      {tab === 'trips' && (
        <div className="account-stack">
          <div className="account-panel">
            <p>
              Last trip completed:{' '}
              {inf.last_trip_completed_at
                ? new Date(String(inf.last_trip_completed_at)).toLocaleString('en-IN')
                : '—'}
            </p>
            <p>
              Next booking window until:{' '}
              {inf.next_trip_eligible_until
                ? new Date(String(inf.next_trip_eligible_until)).toLocaleDateString('en-IN')
                : '—'}
            </p>
            <label className="account-muted" style={{ display: 'block', marginTop: 12, fontSize: '0.88rem' }}>
              Extend booking window (admin override)
            </label>
            <input
              type="date"
              className="apply-input"
              defaultValue={
                inf.next_trip_eligible_until
                  ? String(inf.next_trip_eligible_until).slice(0, 10)
                  : ''
              }
              id="extend-until"
            />
            <button
              type="button"
              className="apply-submit"
              style={{ marginTop: 8 }}
              onClick={() => {
                const el = document.getElementById('extend-until') as HTMLInputElement | null
                if (el?.value) patch({ nextTripEligibleUntil: el.value })
              }}
            >
              Save extended window
            </button>
          </div>
          {((data.tripSlots as Record<string, unknown>[]) ?? []).map((s) => {
            const dep = s.batch_departures as { label: string } | { label: string }[] | null
            const label = Array.isArray(dep) ? dep[0]?.label : dep?.label
            const batch = s.batches as { name: string } | { name: string }[] | null
            const batchName = Array.isArray(batch) ? batch[0]?.name : batch?.name
            return (
              <div key={String(s.id)} className="account-panel">
                <strong>{batchName ?? String(s.batch_slug)}</strong>
                <p className="account-muted">
                  {s.departure_date && s.return_date
                    ? `${String(s.departure_date)} → ${String(s.return_date)}`
                    : label ?? '—'}
                </p>
                <p>
                  Status: {String(s.status)} · {String(s.booking_mode ?? 'preset')}
                </p>
                {s.status !== 'completed' && (
                  <button
                    type="button"
                    className="admin-link-btn"
                    onClick={() =>
                      fetch(`/api/admin/trip-slots/${s.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'complete' }),
                      }).then(() => load())
                    }
                  >
                    Mark trip completed
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'content' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <tbody>
              {((data.contentItems as Record<string, unknown>[]) ?? []).map((c) => (
                <tr key={String(c.id)}>
                  <td>{String(c.type)}</td>
                  <td>{String(c.status)}</td>
                  <td>{c.due_date ? String(c.due_date).slice(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="account-panel">
          {((data.notifications as Record<string, unknown>[]) ?? []).slice(0, 10).map((n) => (
            <p key={String(n.id)}>
              <strong>{String(n.title)}</strong> — {String(n.body)}
            </p>
          ))}
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
