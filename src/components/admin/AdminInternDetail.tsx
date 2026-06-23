'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import { CAREERS_ROLES } from '@/content/careers/roles'
import type { InternApplicationStatus, InternTrackSlug } from '@/content/careers/types'

interface InternApplicationDetail {
  id: string
  full_name: string
  email: string
  phone: string | null
  college: string
  course: string | null
  year_of_study: string
  track: InternTrackSlug
  portfolio_url: string
  why_togetha: string | null
  resume_storage_path: string | null
  status: InternApplicationStatus
  assignment_sent_at: string | null
  notes: string | null
  created_at: string
}

const STATUS_OPTIONS: InternApplicationStatus[] = [
  'assignment_sent',
  'applied',
  'reviewed',
  'shortlisted',
  'rejected',
]

function statusBadgeColor(
  status: InternApplicationStatus
): 'teal' | 'rose' | 'gold' | 'ink' {
  switch (status) {
    case 'shortlisted':
      return 'teal'
    case 'rejected':
      return 'rose'
    case 'reviewed':
      return 'ink'
    default:
      return 'gold'
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function AdminInternDetail({ application }: { application: InternApplicationDetail }) {
  const router = useRouter()
  const [status, setStatus] = useState(application.status)
  const [notes, setNotes] = useState(application.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const roleTitle = CAREERS_ROLES[application.track]?.title ?? application.track

  const save = async () => {
    setSaving(true)
    setMessage(null)
    const res = await fetch(`/api/admin/interns/${application.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    })
    const json = await res.json()
    if (!res.ok) {
      setMessage(json.error ?? 'Save failed')
    } else {
      setMessage('Saved')
      router.refresh()
    }
    setSaving(false)
  }

  const downloadResume = async () => {
    setDownloading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/interns/${application.id}/resume`)
      const json = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !json.url) {
        throw new Error(json.error || 'Download failed')
      }
      window.open(json.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not download resume')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="admin-stack">
      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-title">{application.full_name}</h2>
          <Badge color={statusBadgeColor(application.status)}>{application.status}</Badge>
        </div>

        <dl className="admin-dl">
          <div>
            <dt>Role</dt>
            <dd>{roleTitle}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${application.email}`} className="admin-inline-link">
                {application.email}
              </a>
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{application.phone || '—'}</dd>
          </div>
          <div>
            <dt>College</dt>
            <dd>
              {application.college}
              {application.course && (
                <span className="admin-muted"> · {application.course}</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Year of study</dt>
            <dd>{application.year_of_study}</dd>
          </div>
          <div>
            <dt>Portfolio</dt>
            <dd>
              <a
                href={application.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-inline-link"
              >
                {application.portfolio_url}
              </a>
            </dd>
          </div>
          <div>
            <dt>Applied</dt>
            <dd>{formatDateTime(application.created_at)}</dd>
          </div>
          <div>
            <dt>Assignment sent</dt>
            <dd>
              {application.assignment_sent_at
                ? formatDateTime(application.assignment_sent_at)
                : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {application.why_togetha && (
        <div className="admin-panel">
          <h3 className="admin-panel-title">Why Togetha?</h3>
          <p className="admin-match-narrative">{application.why_togetha}</p>
        </div>
      )}

      {application.resume_storage_path && (
        <div className="admin-panel">
          <h3 className="admin-panel-title">Resume</h3>
          <button
            type="button"
            className="admin-btn"
            disabled={downloading}
            onClick={downloadResume}
          >
            {downloading ? 'Opening…' : 'Download resume PDF'}
          </button>
        </div>
      )}

      <div className="admin-panel">
        <h3 className="admin-panel-title">Review</h3>
        <label className="admin-field">
          <span>Status</span>
          <select
            className="apply-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as InternApplicationStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>Internal notes</span>
          <textarea
            className="apply-input admin-textarea"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ops notes — not visible to applicant"
          />
        </label>
        {message && <p className="admin-msg">{message}</p>}
        <button type="button" className="admin-btn" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save review'}
        </button>
      </div>
    </div>
  )
}
