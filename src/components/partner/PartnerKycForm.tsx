'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isValidPan, maskPan } from '@/lib/partner-portal'
import { ROUTES } from '@/constants/routes'

type Props = {
  panVerified: boolean
  panNumber: string | null
}

export default function PartnerKycForm({ panVerified, panNumber }: Props) {
  const router = useRouter()
  const [pan, setPan] = useState(panNumber ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')
    const normalized = pan.trim().toUpperCase()
    if (!isValidPan(normalized)) {
      setError('Invalid PAN format (e.g. ABCDE1234F)')
      return
    }
    if (!file && !panNumber) {
      setError('Upload your PAN document (JPEG, PNG, or PDF).')
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      form.set('panNumber', normalized)
      if (file) form.set('panDoc', file)
      const res = await fetch('/api/partner/kyc', { method: 'PATCH', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      setMsg('KYC details saved. Our team will verify your PAN within 24 hours.')
      router.push(ROUTES.partner)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  if (panVerified) {
    return (
      <p className="account-msg" style={{ color: 'var(--teal-stamp)' }}>
        ✓ PAN verified {panNumber ? `(${maskPan(panNumber)})` : ''}
      </p>
    )
  }

  return (
    <form className="account-panel" onSubmit={submit}>
      <h2 className="account-panel-title">Identity verification</h2>
      <div className="apply-field">
        <label className="apply-label" htmlFor="pan">
          PAN number
        </label>
        <input
          id="pan"
          className="apply-input"
          value={panNumber && !pan ? maskPan(panNumber) : pan}
          onChange={(e) => setPan(e.target.value.toUpperCase())}
          disabled={Boolean(panNumber)}
          placeholder="ABCDE1234F"
        />
      </div>
      <div className="apply-field">
        <label className="apply-label" htmlFor="pan-doc">
          PAN document
        </label>
        <input
          id="pan-doc"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file && (
          <p className="account-muted">
            {file.name} ({(file.size / 1024).toFixed(0)} KB)
          </p>
        )}
      </div>
      {error && <p className="apply-error">{error}</p>}
      {msg && <p className="account-msg">{msg}</p>}
      <button type="submit" className="apply-submit" disabled={loading}>
        {loading ? 'Saving…' : 'Submit KYC →'}
      </button>
    </form>
  )
}
