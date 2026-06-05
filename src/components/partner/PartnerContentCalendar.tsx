'use client'

import { useEffect, useState } from 'react'
import Badge from '@/components/ui/Badge'

type Item = {
  id: string
  type: string
  status: string
  dueDate: string
  batchName: string
  departureLabel: string | null
  submittedUrl: string | null
  submittedAt: string | null
  feedback: string | null
}

function typeLabel(t: string) {
  if (t === 'pre_trip') return 'Pre-trip'
  if (t === 'daily_story') return 'Daily story'
  return 'Post-trip'
}

function dueLabel(iso: string, status: string) {
  const due = new Date(iso)
  const now = new Date()
  const days = Math.ceil((due.getTime() - now.getTime()) / 86400000)
  if (status === 'overdue') return `${Math.abs(days)} days overdue`
  if (days === 0) return 'TODAY'
  if (days > 0) return `In ${days} days`
  return 'Due'
}

export default function PartnerContentCalendar() {
  const [items, setItems] = useState<Item[]>([])
  const [selected, setSelected] = useState<Item | null>(null)
  const [url, setUrl] = useState('')
  const [asci, setAsci] = useState([false, false, false])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetch('/api/partner/content')
      .then((r) => r.json())
      .then((json) => {
        setItems(json.items ?? [])
        if (!selected && json.items?.[0]) setSelected(json.items[0])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async () => {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/partner/content/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submittedUrl: url,
          asciChecked: asci.every(Boolean),
          disclosureConfirmed: asci.every(Boolean),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submit failed')
      load()
      setUrl('')
      setAsci([false, false, false])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="account-muted">Loading…</p>

  const cur = selected

  return (
    <div className="account-stack">
      <h1 className="account-title">Content calendar</h1>
      <div className="portal-two-col">
        <div>
          {items.length === 0 ? (
            <p className="account-muted">No content deadlines yet. Book a complimentary trip to get your calendar.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`portal-timeline-card${selected?.id === item.id ? ' selected' : ''}${item.status === 'overdue' ? ' overdue' : ''}`}
                onClick={() => setSelected(item)}
                onKeyDown={(e) => e.key === 'Enter' && setSelected(item)}
                role="button"
                tabIndex={0}
              >
                <Badge>{typeLabel(item.type)}</Badge>
                <strong style={{ display: 'block', marginTop: 8 }}>{item.batchName}</strong>
                <span className="account-muted">{item.departureLabel ?? ''}</span>
                <div style={{ marginTop: 8 }}>
                  Due {new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ·{' '}
                  <span style={item.status === 'overdue' ? { color: 'var(--rose)' } : undefined}>
                    {dueLabel(item.dueDate, item.status)}
                  </span>
                </div>
                <Badge>{item.status}</Badge>
              </div>
            ))
          )}
        </div>
        <div className="account-panel">
          {!cur ? (
            <p className="account-muted">Select an item</p>
          ) : cur.status === 'submitted' ? (
            <p>
              Submitted {cur.submittedAt ? new Date(cur.submittedAt).toLocaleString('en-IN') : ''} — waiting for
              review.
              {cur.submittedUrl && (
                <a href={cur.submittedUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 8 }}>
                  Preview →
                </a>
              )}
            </p>
          ) : cur.status === 'approved' ? (
            <p className="account-msg" style={{ color: 'var(--teal-stamp)' }}>
              ✓ Approved
            </p>
          ) : cur.status === 'rejected' ? (
            <>
              <p className="apply-error">{cur.feedback ?? 'Changes requested'}</p>
              <div className="portal-upload-zone" style={{ marginTop: 12 }}>
                <input
                  className="apply-input"
                  placeholder="Paste Reel / Story URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="portal-upload-zone">
                <input
                  className="apply-input"
                  placeholder="Paste a URL (Reel, Story, YouTube)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                {[
                  'My caption starts with #Ad, #Collab, or #PaidPartnership',
                  'I have tagged @togetha.club in the post',
                  'I have not made unverified claims about destinations or experiences',
                ].map((label, i) => (
                  <label key={label} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={asci[i]}
                      onChange={(e) => {
                        const next = [...asci]
                        next[i] = e.target.checked
                        setAsci(next)
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {error && <p className="apply-error">{error}</p>}
              <button
                type="button"
                className="apply-submit"
                disabled={!url || !asci.every(Boolean) || saving}
                onClick={submit}
              >
                {saving ? 'Submitting…' : 'Submit for review →'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
