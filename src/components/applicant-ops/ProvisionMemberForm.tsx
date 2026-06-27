'use client'

import { useState } from 'react'
import Link from 'next/link'

type ProvisionMemberFormProps = {
  packagePriceLabel: string
  apiPath?: string
  applicantDetailPathPrefix?: string
}

export default function ProvisionMemberForm({
  packagePriceLabel,
  apiPath = '/api/admin/members/provision',
  applicantDetailPathPrefix = '/admin/applicants/',
}: ProvisionMemberFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    applicantId: string
    email: string
    temporaryPassword: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const res = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Failed to provision member login')
      setLoading(false)
      return
    }

    setResult({
      applicantId: json.applicantId,
      email: json.email,
      temporaryPassword: json.temporaryPassword,
    })
    setName('')
    setEmail('')
    setPhone('')
    setLoading(false)
  }

  return (
    <div className="admin-card admin-panel">
      <h2 className="admin-section-title">Provision member portal login</h2>
      <p className="admin-muted" style={{ marginBottom: 16 }}>
        For direct calls and DMs. Creates a booking record at {packagePriceLabel}, sends a
        welcome email with a temporary password via Resend. The member then logs in, links their
        Razorpay payment ID, and completes the quiz.
      </p>

      <form onSubmit={handleSubmit} className="admin-form-stack">
        <label className="admin-label">
          Full name
          <input
            className="admin-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vishesh Mittal"
            required
            disabled={loading}
          />
        </label>
        <label className="admin-label">
          Email
          <input
            type="email"
            className="admin-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@email.com"
            required
            disabled={loading}
          />
        </label>
        <label className="admin-label">
          Phone (WhatsApp)
          <input
            type="tel"
            className="admin-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9876543210"
            required
            disabled={loading}
          />
        </label>

        {error && (
          <p className="apply-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="admin-btn" disabled={loading}>
          {loading ? 'Sending…' : 'Create login + email credentials →'}
        </button>
      </form>

      {result && (
        <div className="admin-panel" style={{ marginTop: 20, background: '#e8f5e9' }}>
          <p className="admin-section-title" style={{ color: '#1b5e20' }}>
            Credentials sent to {result.email}
          </p>
          <p className="admin-muted">
            Temporary password (also emailed):{' '}
            <code>{result.temporaryPassword}</code>
          </p>
          <Link href={`${applicantDetailPathPrefix}${result.applicantId}`} className="admin-btn">
            View applicant →
          </Link>
        </div>
      )}
    </div>
  )
}
