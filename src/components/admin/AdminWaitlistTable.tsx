'use client'

import { useEffect, useState } from 'react'

interface WaitlistRow {
  id: string
  email: string
  gender: 'm' | 'f' | null
  batch_slug: string
  created_at: string
}

export default function AdminWaitlistTable() {
  const [rows, setRows] = useState<WaitlistRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/waitlist')
      .then((r) => r.json())
      .then((json) => setRows(json.waitlist ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="admin-muted">Loading waitlist…</p>

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
