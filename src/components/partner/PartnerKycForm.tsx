'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  KYC_DOCUMENT_OPTIONS,
  type KycDocumentType,
  kycDocumentLabel,
  maskKycDocumentNumber,
  normalizeKycDocumentNumber,
  validateKycDocument,
} from '@/lib/partner-kyc'
import { ROUTES } from '@/constants/routes'

type Props = {
  panVerified: boolean
  kycDocumentType?: KycDocumentType | null
  kycDocumentNumber?: string | null
  kycDocUrl?: string | null
  panNumber?: string | null
}

export default function PartnerKycForm({
  panVerified,
  kycDocumentType,
  kycDocumentNumber,
  kycDocUrl,
  panNumber,
}: Props) {
  const router = useRouter()
  const savedType = kycDocumentType ?? (panNumber ? 'pan' : 'pan')
  const savedNumber = kycDocumentNumber ?? panNumber ?? ''
  const numberLocked = Boolean(savedNumber)

  const [documentType, setDocumentType] = useState<KycDocumentType>(savedType)
  const [documentNumber, setDocumentNumber] = useState(savedNumber)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const activeOption = useMemo(
    () => KYC_DOCUMENT_OPTIONS.find((o) => o.id === documentType) ?? KYC_DOCUMENT_OPTIONS[0],
    [documentType]
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')

    const validationError = validateKycDocument(documentType, documentNumber)
    if (validationError) {
      setError(validationError)
      return
    }
    if (!file && !kycDocUrl) {
      setError(`Upload your ${kycDocumentLabel(documentType).toLowerCase()} (JPEG, PNG, or PDF).`)
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.set('documentType', documentType)
      form.set('documentNumber', normalizeKycDocumentNumber(documentType, documentNumber))
      if (file) form.set('kycDoc', file)
      const res = await fetch('/api/partner/kyc', { method: 'PATCH', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      setMsg('KYC details saved. Our team will verify your document within 24 hours.')
      router.push(ROUTES.partner)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  if (panVerified) {
    const label = kycDocumentLabel(kycDocumentType ?? 'pan')
    const masked = savedNumber ? maskKycDocumentNumber(kycDocumentType ?? 'pan', savedNumber) : ''
    return (
      <p className="account-msg" style={{ color: 'var(--teal-stamp)' }}>
        ✓ {label} verified {masked ? `(${masked})` : ''}
      </p>
    )
  }

  return (
    <form className="account-panel" onSubmit={submit}>
      <h2 className="account-panel-title">Identity verification</h2>
      <p className="account-muted" style={{ marginBottom: 16 }}>
        Choose one government ID to upload. PAN is preferred for payouts, but Aadhaar or driving license works too.
      </p>

      <div className="portal-kyc-options">
        {KYC_DOCUMENT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`portal-kyc-option${documentType === option.id ? ' active' : ''}`}
            onClick={() => {
              if (numberLocked && option.id !== documentType) return
              setDocumentType(option.id)
              if (!numberLocked) setDocumentNumber('')
              setFile(null)
              setError('')
            }}
            disabled={numberLocked && option.id !== documentType}
          >
            <strong>{option.label}</strong>
            <span>{option.hint}</span>
          </button>
        ))}
      </div>

      <div className="apply-field">
        <label className="apply-label" htmlFor="kyc-number">
          {activeOption.numberLabel}
        </label>
        <input
          id="kyc-number"
          className="apply-input"
          value={
            numberLocked && savedNumber
              ? maskKycDocumentNumber(documentType, savedNumber)
              : documentNumber
          }
          onChange={(e) => {
            const value = e.target.value
            if (documentType === 'pan') {
              setDocumentNumber(value.toUpperCase())
              return
            }
            if (documentType === 'aadhaar') {
              setDocumentNumber(value.replace(/\D/g, '').slice(0, 12))
              return
            }
            setDocumentNumber(value.toUpperCase())
          }}
          disabled={numberLocked}
          placeholder={activeOption.numberPlaceholder}
          inputMode={documentType === 'aadhaar' ? 'numeric' : 'text'}
        />
      </div>

      <div className="apply-field">
        <label className="apply-label" htmlFor="kyc-doc">
          {activeOption.label} document
        </label>
        <input
          id="kyc-doc"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file && (
          <p className="account-muted">
            {file.name} ({(file.size / 1024).toFixed(0)} KB)
          </p>
        )}
        {kycDocUrl && !file && (
          <p className="account-muted">Document on file — upload again to replace it.</p>
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
