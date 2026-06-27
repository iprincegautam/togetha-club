'use client'

import { useEffect, useState } from 'react'

interface WaitlistRow {
  id: string
  email: string
  gender: 'm' | 'f' | null
  batch_slug: string
  created_at: string
}

type SupportWaitlistTableProps = {
  apiPath?: string
}

export default function SupportWaitlistTable({
  apiPath = '/api/support/waitlist',
}: SupportWaitlistTableProps) {
  const [rows, setRows] = useState<WaitlistRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(apiPath)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error)
          return
        }
        setRows(json.waitlist ?? [])
      })
      .catch(() => setError('Could not load waitlist'))
      .finally(() => setLoading(false))
  }, [apiPath])

  if (loading) return <p className="admin-muted">Loading waitlist…</p>
  if (error) return <p className="apply-error">{error}</p>

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Gender</th>
            <th>Batch</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="admin-table-empty">No waitlist entries yet.</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td>{row.email}</td>
                <td>{row.gender === 'm' ? 'M' : row.gender === 'f' ? 'F' : '—'}</td>
                <td>{row.batch_slug}</td>
                <td>{new Date(row.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
