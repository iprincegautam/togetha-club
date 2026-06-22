'use client'

import { useEffect, useMemo, useState } from 'react'
import Badge from '@/components/ui/Badge'
import { CAREERS_ROLES } from '@/content/careers/roles'
import type { InternApplicationStatus, InternTrackSlug } from '@/content/careers/types'

interface InternApplicationRow {
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
  created_at: string
}

const TRACK_OPTIONS: { value: InternTrackSlug | 'all'; label: string }[] = [
  { value: 'all', label: 'All roles' },
  ...Object.values(CAREERS_ROLES).map((r) => ({ value: r.slug, label: r.title })),
]

const STATUS_OPTIONS: { value: InternApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'assignment_sent', label: 'Assignment sent' },
  { value: 'applied', label: 'Applied' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

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

export default function AdminInternsTable() {
  const [rows, setRows] = useState<InternApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trackFilter, setTrackFilter] = useState<InternTrackSlug | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<InternApplicationStatus | 'all'>('all')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/interns')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setRows(json.applications ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load applications'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (trackFilter !== 'all' && row.track !== trackFilter) return false
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      return true
    })
  }, [rows, trackFilter, statusFilter])

  const handleDownloadResume = async (id: string) => {
    setDownloadingId(id)
    try {
      const res = await fetch(`/api/admin/interns/${id}/resume`)
      const json = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !json.url) {
        throw new Error(json.error || 'Download failed')
      }
      window.open(json.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not download resume')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) return <p className="admin-muted">Loading founding team applications…</p>
  if (error) return <p className="apply-error">{error}</p>

  return (
    <>
      <div className="admin-filter">
        <label className="admin-filter-label">
          Role
          <select
            className="admin-filter-select"
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value as InternTrackSlug | 'all')}
          >
            {TRACK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-filter-label">
          Status
          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as InternApplicationStatus | 'all')
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <span className="admin-muted">{filtered.length} application(s)</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>College</th>
              <th>Year</th>
              <th>Role</th>
              <th>Status</th>
              <th>Applied</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-table-empty">
                  No founding team applications yet.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.full_name}</td>
                  <td>
                    <a href={`mailto:${row.email}`} className="admin-inline-link">
                      {row.email}
                    </a>
                    {row.phone && (
                      <div className="admin-muted" style={{ fontSize: '0.78rem' }}>
                        {row.phone}
                      </div>
                    )}
                  </td>
                  <td>
                    {row.college}
                    {row.course && (
                      <div className="admin-muted" style={{ fontSize: '0.78rem' }}>
                        {row.course}
                      </div>
                    )}
                  </td>
                  <td>{row.year_of_study}</td>
                  <td>{CAREERS_ROLES[row.track]?.title ?? row.track}</td>
                  <td>
                    <Badge color={statusBadgeColor(row.status)}>{row.status}</Badge>
                  </td>
                  <td>{formatDate(row.created_at)}</td>
                  <td>
                    <div className="admin-link-stack">
                      <a
                        href={row.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-inline-link"
                      >
                        Portfolio
                      </a>
                      {row.resume_storage_path && (
                        <button
                          type="button"
                          className="admin-inline-link admin-link-button"
                          disabled={downloadingId === row.id}
                          onClick={() => handleDownloadResume(row.id)}
                        >
                          {downloadingId === row.id ? 'Opening…' : 'Resume PDF'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
