'use client'

import { Fragment, useEffect, useState } from 'react'
import {
  DEFAULT_SUPPORT_PERMISSIONS,
  DEFAULT_SUPPORT_VIEW_SCOPE,
  SUPPORT_PERMISSION_LABELS,
  SUPPORT_PERMISSIONS,
  isSupportPermission,
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

type StaffEditDraft = {
  fullName: string
  viewScope: SupportViewScope
  permissions: SupportPermission[]
  isActive: boolean
}

function scopeLabel(scope: SupportViewScope): string {
  return scope === 'all' ? 'All applicants' : 'Assigned only'
}

function PermissionCheckboxes({
  permissions,
  onToggle,
  disabled,
  idPrefix,
}: {
  permissions: SupportPermission[]
  onToggle: (perm: SupportPermission) => void
  disabled?: boolean
  idPrefix: string
}) {
  return (
    <div className="admin-checkbox-grid">
      {SUPPORT_PERMISSIONS.map((perm) => (
        <label key={perm} className="admin-checkbox">
          <input
            id={`${idPrefix}-${perm}`}
            type="checkbox"
            checked={permissions.includes(perm)}
            onChange={() => onToggle(perm)}
            disabled={disabled}
          />
          {SUPPORT_PERMISSION_LABELS[perm]}
        </label>
      ))}
    </div>
  )
}

export default function AdminSupportStaffManager() {
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [viewScope, setViewScope] = useState<SupportViewScope>(DEFAULT_SUPPORT_VIEW_SCOPE)
  const [permissions, setPermissions] = useState<SupportPermission[]>([...DEFAULT_SUPPORT_PERMISSIONS])
  const [provisioning, setProvisioning] = useState(false)
  const [provisionResult, setProvisionResult] = useState<{
    email: string
    temporaryPassword: string
  } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<StaffEditDraft | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

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

  const toggleInvitePermission = (perm: SupportPermission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const toggleEditPermission = (perm: SupportPermission) => {
    setEditDraft((prev) => {
      if (!prev) return prev
      const next = prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm]
      return { ...prev, permissions: next }
    })
  }

  const startEdit = (row: StaffRow) => {
    setError(null)
    setEditingId(row.profile_id)
    setEditDraft({
      fullName: row.profile?.full_name ?? '',
      viewScope: row.view_scope,
      permissions: row.permissions.filter(isSupportPermission),
      isActive: row.is_active,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(null)
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
    patch: {
      fullName?: string
      viewScope?: SupportViewScope
      isActive?: boolean
      permissions?: SupportPermission[]
    }
  ) => {
    const res = await fetch(`/api/admin/support-staff/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Update failed')
      return false
    }
    return true
  }

  const saveEdit = async () => {
    if (!editingId || !editDraft) return
    setSavingEdit(true)
    setError(null)

    const ok = await updateStaff(editingId, {
      fullName: editDraft.fullName,
      viewScope: editDraft.viewScope,
      isActive: editDraft.isActive,
      permissions: editDraft.permissions,
    })

    if (ok) {
      cancelEdit()
      load()
    }
    setSavingEdit(false)
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
              <option value="all">All applicants</option>
              <option value="assigned_only">Assigned applicants only</option>
            </select>
          </label>
          <fieldset className="admin-field">
            <legend>Permissions</legend>
            <PermissionCheckboxes
              idPrefix="invite"
              permissions={permissions}
              onToggle={toggleInvitePermission}
              disabled={provisioning}
            />
          </fieldset>
          {error && !editingId && <p className="apply-error">{error}</p>}
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
                  <Fragment key={row.profile_id}>
                    <tr>
                      <td>{row.profile?.full_name || '—'}</td>
                      <td>{row.profile?.email ?? '—'}</td>
                      <td>{scopeLabel(row.view_scope)}</td>
                      <td>{row.is_active ? 'Yes' : 'No'}</td>
                      <td>{row.permissions.length}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <button
                            type="button"
                            className="admin-link-btn"
                            onClick={() =>
                              editingId === row.profile_id ? cancelEdit() : startEdit(row)
                            }
                          >
                            {editingId === row.profile_id ? 'Close' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            className="admin-link-btn"
                            onClick={() =>
                              updateStaff(row.profile_id, { isActive: !row.is_active }).then(
                                (ok) => ok && load()
                              )
                            }
                          >
                            {row.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingId === row.profile_id && editDraft && (
                      <tr>
                        <td colSpan={6}>
                          <div
                            className="admin-panel"
                            style={{ marginTop: 8, background: 'var(--cream, #faf8f5)' }}
                          >
                            <h3 className="admin-section-title" style={{ fontSize: '1rem' }}>
                              Edit {row.profile?.email}
                            </h3>
                            <div className="admin-form-stack">
                              <label className="admin-label">
                                Full name
                                <input
                                  className="admin-input"
                                  value={editDraft.fullName}
                                  onChange={(e) =>
                                    setEditDraft({ ...editDraft, fullName: e.target.value })
                                  }
                                  disabled={savingEdit}
                                />
                              </label>
                              <label className="admin-label">
                                View scope
                                <select
                                  className="apply-select"
                                  value={editDraft.viewScope}
                                  onChange={(e) =>
                                    setEditDraft({
                                      ...editDraft,
                                      viewScope: e.target.value as SupportViewScope,
                                    })
                                  }
                                  disabled={savingEdit}
                                >
                                  <option value="all">All applicants</option>
                                  <option value="assigned_only">Assigned applicants only</option>
                                </select>
                              </label>
                              <label className="admin-checkbox">
                                <input
                                  type="checkbox"
                                  checked={editDraft.isActive}
                                  onChange={(e) =>
                                    setEditDraft({ ...editDraft, isActive: e.target.checked })
                                  }
                                  disabled={savingEdit}
                                />
                                Account active (can sign in)
                              </label>
                              <fieldset className="admin-field">
                                <legend>Permissions</legend>
                                <PermissionCheckboxes
                                  idPrefix={`edit-${row.profile_id}`}
                                  permissions={editDraft.permissions}
                                  onToggle={toggleEditPermission}
                                  disabled={savingEdit}
                                />
                              </fieldset>
                              {error && editingId === row.profile_id && (
                                <p className="apply-error">{error}</p>
                              )}
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="admin-btn"
                                  disabled={savingEdit}
                                  onClick={saveEdit}
                                >
                                  {savingEdit ? 'Saving…' : 'Save changes'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-link-btn"
                                  disabled={savingEdit}
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
