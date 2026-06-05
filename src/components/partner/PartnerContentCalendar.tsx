'use client'

import { useEffect, useState } from 'react'
import Badge from '@/components/ui/Badge'

type Item = {
  id: string
  type: string
  status: string
  dueDate: string | null
  scheduledUploadDate: string | null
  batchName: string
  departureLabel: string | null
  tripDepartureDate: string | null
  submittedUrl: string | null
  submittedAt: string | null
  feedback: string | null
}

const ASCI_LABELS = [
  'My caption starts with #Ad, #Collab, or #PaidPartnership',
  'I have tagged @togetha.club in the post',
  'I have not made unverified claims about destinations or experiences',
]

function typeLabel(t: string) {
  if (t === 'pre_trip') return 'Announcement'
  if (t === 'daily_story') return 'Daily story'
  return 'Post-trip'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dueLabel(iso: string | null, status: string) {
  if (!iso) return null
  const due = new Date(iso)
  const now = new Date()
  const days = Math.ceil((due.getTime() - now.getTime()) / 86400000)
  if (status === 'overdue') return `${Math.abs(days)} days overdue`
  if (days === 0) return 'TODAY'
  if (days > 0) return `In ${days} days`
  return 'Due'
}

function toDateInputValue(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function cardScheduleText(item: Item) {
  if (item.type === 'pre_trip') {
    if (item.scheduledUploadDate) {
      return `Post by ${formatDate(item.scheduledUploadDate)}`
    }
    return 'Post ASAP — pick your date'
  }
  if (!item.dueDate) return ''
  const label = dueLabel(item.dueDate, item.status)
  return `Due ${formatDate(item.dueDate)}${label ? ` · ${label}` : ''}`
}

export default function PartnerContentCalendar() {
  const [items, setItems] = useState<Item[]>([])
  const [selected, setSelected] = useState<Item | null>(null)
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [asci, setAsci] = useState([false, false, false])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = (keepSelectedId?: string) => {
    fetch('/api/partner/content')
      .then((r) => r.json())
      .then((json) => {
        const next = json.items ?? []
        setItems(next)
        if (keepSelectedId) {
          const found = next.find((i: Item) => i.id === keepSelectedId)
          if (found) setSelected(found)
        } else if (!selected && next[0]) {
          setSelected(next[0])
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setUrl('')
    setScheduleDate('')
    setAsci([false, false, false])
    setEditing(false)
    setError('')
  }

  const selectItem = (item: Item) => {
    setSelected(item)
    resetForm()
  }

  const startEdit = (item: Item) => {
    setSelected(item)
    setEditing(true)
    setUrl(item.submittedUrl ?? '')
    setScheduleDate(toDateInputValue(item.scheduledUploadDate))
    setAsci([true, true, true])
    setError('')
  }

  const saveScheduleOnly = async (item: Item, dateValue: string) => {
    if (!dateValue) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/partner/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'schedule', scheduledUploadDate: dateValue }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not save date')
      load(item.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save date')
    } finally {
      setSaving(false)
    }
  }

  const submit = async () => {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/partner/content/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          submittedUrl: url,
          scheduledUploadDate: selected.type === 'pre_trip' ? scheduleDate : undefined,
          asciChecked: asci.every(Boolean),
          disclosureConfirmed: asci.every(Boolean),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submit failed')
      resetForm()
      load(selected.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setSaving(false)
    }
  }

  const clearSubmission = async (item: Item) => {
    if (!window.confirm('Remove this submission? You can upload again afterwards.')) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/partner/content/${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Delete failed')
      resetForm()
      load(item.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  const showSubmitForm =
    selected &&
    (editing || selected.status === 'pending' || selected.status === 'overdue')

  const renderActions = (item: Item) => {
    const hasUrl = Boolean(item.submittedUrl)
    const canEdit =
      item.status === 'submitted' || item.status === 'rejected' || item.status === 'approved'
    const canDelete = hasUrl && item.status !== 'approved'

    return (
      <div className="portal-content-actions">
        {hasUrl && (
          <a
            href={item.submittedUrl!}
            target="_blank"
            rel="noreferrer"
            className="portal-content-action-btn preview"
          >
            Preview
          </a>
        )}
        {canEdit && item.status !== 'approved' && (
          <button type="button" className="portal-content-action-btn" onClick={() => startEdit(item)} disabled={saving}>
            Edit
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            className="portal-content-action-btn danger"
            onClick={() => clearSubmission(item)}
            disabled={saving}
          >
            Delete
          </button>
        )}
      </div>
    )
  }

  const renderSubmitForm = () => {
    if (!selected) return null

    return (
      <>
        {selected.type === 'pre_trip' && (
          <div style={{ marginBottom: 16 }}>
            <label className="account-muted" style={{ display: 'block', marginBottom: 8, fontSize: '0.88rem' }}>
              When do you plan to post your announcement video?
            </label>
            <p className="account-muted" style={{ fontSize: '0.82rem', marginBottom: 8 }}>
              Post as soon as you can — even a month before your trip is fine.
            </p>
            <input
              type="date"
              className="apply-input"
              value={scheduleDate}
              onChange={(e) => {
                setScheduleDate(e.target.value)
                if (e.target.value && selected.status === 'pending' && !editing) {
                  saveScheduleOnly(selected, e.target.value)
                }
              }}
            />
          </div>
        )}

        <div className="portal-upload-zone">
          <input
            className="apply-input"
            placeholder="Paste a URL (Reel, Story, YouTube)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          {ASCI_LABELS.map((label, i) => (
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

        <div className="portal-content-actions" style={{ marginTop: 16 }}>
          {editing && (
            <button type="button" className="portal-content-action-btn" onClick={resetForm} disabled={saving}>
              Cancel
            </button>
          )}
          <button
            type="button"
            className="apply-submit"
            disabled={
              !url ||
              !asci.every(Boolean) ||
              saving ||
              (selected.type === 'pre_trip' && !scheduleDate)
            }
            onClick={submit}
          >
            {saving ? 'Submitting…' : editing ? 'Save changes →' : 'Submit for review →'}
          </button>
        </div>
      </>
    )
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
                onClick={() => selectItem(item)}
                onKeyDown={(e) => e.key === 'Enter' && selectItem(item)}
                role="button"
                tabIndex={0}
              >
                <Badge>{typeLabel(item.type)}</Badge>
                <strong style={{ display: 'block', marginTop: 8 }}>{item.batchName}</strong>
                <span className="account-muted">{item.departureLabel ?? ''}</span>
                <div style={{ marginTop: 8 }} className="account-muted">
                  {cardScheduleText(item)}
                </div>
                <Badge>{item.status}</Badge>
              </div>
            ))
          )}
        </div>

        <div className="account-panel">
          {!cur ? (
            <p className="account-muted">Select an item</p>
          ) : cur.status === 'approved' ? (
            <>
              <p className="account-msg" style={{ color: 'var(--teal-stamp)' }}>
                ✓ Approved
              </p>
              {cur.submittedAt && (
                <p className="account-muted" style={{ marginTop: 8 }}>
                  Submitted {new Date(cur.submittedAt).toLocaleString('en-IN')}
                </p>
              )}
              {renderActions(cur)}
            </>
          ) : cur.status === 'submitted' && !editing ? (
            <>
              <p>
                Submitted {cur.submittedAt ? new Date(cur.submittedAt).toLocaleString('en-IN') : ''} — waiting for
                review.
              </p>
              {cur.type === 'pre_trip' && cur.scheduledUploadDate && (
                <p className="account-muted" style={{ marginTop: 8 }}>
                  Planned post date: {formatDate(cur.scheduledUploadDate)}
                </p>
              )}
              {renderActions(cur)}
            </>
          ) : cur.status === 'rejected' && !editing ? (
            <>
              <p className="apply-error">{cur.feedback ?? 'Changes requested'}</p>
              {renderActions(cur)}
            </>
          ) : showSubmitForm ? (
            renderSubmitForm()
          ) : (
            renderActions(cur)
          )}
        </div>
      </div>
    </div>
  )
}
