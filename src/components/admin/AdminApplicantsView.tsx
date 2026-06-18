'use client'

import { useEffect, useState } from 'react'
import AdminApplicantsTable, {
  type AdminApplicantRow,
} from '@/components/admin/AdminApplicantsTable'

export default function AdminApplicantsView() {
  const [applicants, setApplicants] = useState<AdminApplicantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/applicants')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error)
          setApplicants([])
          return
        }
        setApplicants(json.applicants ?? [])
      })
      .catch(() => setError('Could not load applicants'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="admin-loading">Loading applicants…</p>
  }

  if (error) {
    const hint =
      error === 'Unauthorized'
        ? 'Sign out and sign in again at /admin/login.'
        : 'Check Supabase migrations and try again.'
    return (
      <p className="admin-msg" style={{ color: 'var(--rose)' }}>
        {error}. {hint}
      </p>
    )
  }

  return <AdminApplicantsTable applicants={applicants} />
}
