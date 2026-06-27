'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type SupportStaffOption = {
  profileId: string
  fullName: string | null
  email: string
  isActive: boolean
}

type AdminApplicantAssignmentProps = {
  applicantId: string
  assignedSupportId: string | null
  staff: SupportStaffOption[]
}

export default function AdminApplicantAssignment({
  applicantId,
  assignedSupportId,
  staff,
}: AdminApplicantAssignmentProps) {
  const router = useRouter()
  const [value, setValue] = useState(assignedSupportId ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setMessage(null)
    const res = await fetch(`/api/admin/applicants/${applicantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedSupportId: value || null }),
    })
    const json = await res.json()
    if (!res.ok) {
      setMessage(json.error ?? 'Could not update assignment')
    } else {
      setMessage('Assignment saved')
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="admin-panel">
      <h3 className="admin-panel-title">Support assignment</h3>
      <p className="account-muted" style={{ marginBottom: 12 }}>
        Assign this applicant to a support team member. Staff with &quot;assigned only&quot; scope
        will only see their assigned leads.
      </p>
      <label className="admin-field">
        <span>Assigned to</span>
        <select
          className="apply-select"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={saving}
        >
          <option value="">Unassigned</option>
          {staff
            .filter((s) => s.isActive)
            .map((s) => (
              <option key={s.profileId} value={s.profileId}>
                {s.fullName || s.email}
              </option>
            ))}
        </select>
      </label>
      {message && <p className="admin-msg">{message}</p>}
      <button type="button" className="admin-btn" disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save assignment'}
      </button>
    </div>
  )
}
