'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_SUPPORT_PERMISSIONS,
  SUPPORT_PERMISSION_LABELS,
  type SupportPermission,
  type SupportViewScope,
} from '@/lib/support/permissions'

type StaffRow = {
  profile_id: string
  view_scope: SupportViewScope
  is_active: boolean
  profile: { id: string; email: string; full_name: string | null; role: string } | null
  permissions: string[]
}

export default function AdminSupportStaffManager() {
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [viewScope, setViewScope] = useState<SupportViewScope>('assigned_only')
  const [permissions, setPermissions] = useState<SupportPermission[]>([...DEFAULT_SUPPORT_PERMISSIONS])
  const [provisioning, setProvisioning] = useState(false)
  const [provisionResult, setProvisionResult] = useState<{
    email: string
    temporaryPassword: string
  } | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/support-staff')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error)
          return
        }
        setStaff(json.staff ?? [])
      })
      .catch(() => setError('Could not load support staff'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const togglePermission = (perm: SupportPermission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const provision = async (e: React.FormEvent) => {
    e.preventDefault()
    setProvisioning(true)
    setError(null)
    setProvisionResult(null)

    const res = await fetch('/api/admin/support-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, viewScope, permissions }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Could not provision support account')
    } else {
      setProvisionResult({ email: json.email, temporaryPassword: json.temporaryPassword })
      setFullName('')
      setEmail('')
      load()
    }
    setProvisioning(false)
  }

  const updateStaff = async (
    profileId: string,
    patch: { viewScope?: SupportViewScope; isActive?: boolean; permissions?: SupportPermission[] }
  ) => {
    const res = await fetch(`/api/admin/support-staff/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Update failed')
      return
    }
    load()
  }

  if (loading) return <p className="admin-muted">Loading support staff…</p>

  return (
    <div className="admin-stack">
      <div className="admin-panel">
        <h2 className="admin-section-title">Invite support staff</h2>
        <p className="admin-muted" style={{ marginBottom: 16 }}>
          Creates a support portal login at{' '}
          <code>/support/login</code> and emails a temporary password.
        </p>
        <form onSubmit={provision} className="admin-form-stack">
          <label className="admin-label">
            Full name
            <input
              className="admin-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={provisioning}
            />
          </label>
          <label className="admin-label">
            Email
            <input
              type="email"
              className="admin-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={provisioning}
            />
          </label>
          <label className="admin-label">
            View scope
            <select
              className="apply-select"
              value={viewScope}
              onChange={(e) => setViewScope(e.target.value as SupportViewScope)}
              disabled={provisioning}
            >
              <option value="assigned_only">Assigned applicants only</option>
              <option value="all">All applicants</option>
            </select>
          </label>
          <fieldset className="admin-field">
            <legend>Permissions</legend>
            <div className="admin-checkbox-grid">
              {(Object.keys(SUPPORT_PERMISSION_LABELS) as SupportPermission[]).map((perm) => (
                <label key={perm} className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                    disabled={provisioning}
                  />
                  {SUPPORT_PERMISSION_LABELS[perm]}
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p className="apply-error">{error}</p>}
          <button type="submit" className="admin-btn" disabled={provisioning}>
            {provisioning ? 'Creating…' : 'Create support login →'}
          </button>
        </form>
        {provisionResult && (
          <div className="admin-msg" style={{ marginTop: 16 }}>
            Login sent to <strong>{provisionResult.email}</strong> — temp password:{' '}
            <strong>{provisionResult.temporaryPassword}</strong>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <h2 className="admin-section-title">Team members</h2>
        {staff.length === 0 ? (
          <p className="account-muted">No support staff yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Scope</th>
                  <th>Active</th>
                  <th>Permissions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => (
                  <tr key={row.profile_id}>
                    <td>{row.profile?.full_name || '—'}</td>
                    <td>{row.profile?.email ?? '—'}</td>
                    <td>{row.view_scope}</td>
                    <td>{row.is_active ? 'Yes' : 'No'}</td>
                    <td>{row.permissions.length}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-link-btn"
                        onClick={() =>
                          updateStaff(row.profile_id, { isActive: !row.is_active })
                        }
                      >
                        {row.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
