'use client'

import { useState } from 'react'

type AdminResendCredentialsButtonProps = {
  applicantId: string
  email: string
  apiPath?: string
}

export default function AdminResendCredentialsButton({
  applicantId,
  email,
  apiPath,
}: AdminResendCredentialsButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)

  const resend = async () => {
    if (
      !confirm(`Resend member login credentials to ${email}? This resets their password.`)
    ) {
      return
    }

    setLoading(true)
    setMessage(null)
    setTemporaryPassword(null)

    try {
      const res = await fetch(
        apiPath ?? `/api/admin/applicants/${applicantId}/resend-credentials`,
        { method: 'POST' }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Resend failed')
      setMessage(`Credentials emailed to ${json.email}`)
      setTemporaryPassword(json.temporaryPassword ?? null)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Resend failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-credentials-bar">
      <div className="admin-credentials-copy">
        <strong>Member portal</strong>
        <span>
          Resend login email + temporary password to <strong>{email}</strong>
        </span>
      </div>
      <button type="button" className="admin-btn" disabled={loading} onClick={resend}>
        {loading ? 'Sending…' : 'Resend member credentials'}
      </button>
      {message && <p className="admin-msg admin-credentials-msg">{message}</p>}
      {temporaryPassword && (
        <p className="admin-msg admin-credentials-msg">
          Temp password: <strong>{temporaryPassword}</strong>
        </p>
      )}
    </div>
  )
}
