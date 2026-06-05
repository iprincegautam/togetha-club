'use client'

import { useEffect, useState } from 'react'

export default function AdminContentReview() {
  const [tab, setTab] = useState('submitted')
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [overview, setOverview] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch(`/api/admin/content?status=${tab}`)
      .then((r) => r.json())
      .then((json) => {
        setItems(json.items ?? [])
        setOverview(json.overview ?? {})
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    load()
  }, [tab])

  const act = async (id: string, action: 'approve' | 'reject') => {
    await fetch(`/api/admin/content/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, feedback: feedback[id] }),
    })
    load()
  }

  if (loading) return <p className="account-muted">Loading…</p>

  return (
    <div className="account-stack">
      <div className="portal-tabs">
        {['submitted', 'all', 'overdue'].map((t) => (
          <button key={t} type="button" className={`portal-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <p className="account-muted">
        Total {overview.total} · Submitted {overview.submitted} · Approved {overview.approved} · Rejected{' '}
        {overview.rejected}
      </p>
      {items.length === 0 ? (
        <p className="account-muted">No items in this queue.</p>
      ) : (
        items.map((row) => {
          const inf = row.influencers as { name: string; instagram_handle: string } | { name: string }[]
          const name = Array.isArray(inf) ? inf[0]?.name : inf?.name
          const batch = row.batches as { name: string } | { name: string }[]
          const batchName = Array.isArray(batch) ? batch[0]?.name : batch?.name
          return (
            <div key={String(row.id)} className="account-panel">
              <strong>{name}</strong> — {batchName} — {String(row.type)}
              {row.submitted_url != null && String(row.submitted_url) !== '' ? (
                <a href={String(row.submitted_url)} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>
                  Preview
                </a>
              ) : null}
              <div style={{ marginTop: 8 }}>
                <button type="button" className="admin-link-btn" onClick={() => act(String(row.id), 'approve')}>
                  Approve
                </button>
                <input
                  className="apply-input"
                  placeholder="Feedback if rejecting"
                  style={{ marginTop: 8 }}
                  value={feedback[String(row.id)] ?? ''}
                  onChange={(e) => setFeedback({ ...feedback, [String(row.id)]: e.target.value })}
                />
                <button type="button" className="admin-link-btn" onClick={() => act(String(row.id), 'reject')}>
                  Request changes
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
