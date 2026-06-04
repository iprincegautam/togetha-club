'use client'

import { useEffect, useState } from 'react'
import { GLYPH } from '@/constants/brand-glyphs'

interface InfluencerProfile {
  name: string
  email: string | null
  phone: string | null
  bio: string | null
  instagramHandle: string | null
  payoutUpi: string | null
  payoutBankName: string | null
  payoutAccountHolder: string | null
  payoutAccountNumber: string | null
  payoutIfsc: string | null
}

export default function PartnerProfilePage() {
  const [form, setForm] = useState<InfluencerProfile>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    instagramHandle: '',
    payoutUpi: '',
    payoutBankName: '',
    payoutAccountHolder: '',
    payoutAccountNumber: '',
    payoutIfsc: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/partner/me')
      .then((r) => r.json())
      .then((json) => {
        const inf = json.influencer
        if (inf) {
          setForm({
            name: inf.name ?? '',
            email: inf.email ?? '',
            phone: inf.phone ?? '',
            bio: inf.bio ?? '',
            instagramHandle: inf.instagramHandle ?? '',
            payoutUpi: inf.payoutUpi ?? '',
            payoutBankName: inf.payoutBankName ?? '',
            payoutAccountHolder: inf.payoutAccountHolder ?? '',
            payoutAccountNumber: inf.payoutAccountNumber ?? '',
            payoutIfsc: inf.payoutIfsc ?? '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setMsg(null)
    const res = await fetch('/api/partner/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        bio: form.bio,
        instagramHandle: form.instagramHandle,
        payoutUpi: form.payoutUpi,
        payoutBankName: form.payoutBankName,
        payoutAccountHolder: form.payoutAccountHolder,
        payoutAccountNumber: form.payoutAccountNumber,
        payoutIfsc: form.payoutIfsc,
      }),
    })
    const json = await res.json()
    setMsg(res.ok ? 'Profile saved' : (json.error ?? 'Save failed'))
    setSaving(false)
  }

  if (loading) return <p className="account-muted">Loading profile…</p>

  return (
    <div className="account-stack">
      <div className="account-panel">
        <p className="apply-eyebrow">{GLYPH.match} Partner profile {GLYPH.match}</p>
        <h1 className="account-title">Profile & payout</h1>
        <p className="account-sub">
          Update how we reach you and where to send commission payouts. Use Settings in the sidebar for
          email and password.
        </p>
      </div>

      <form
        className="account-panel account-form"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <h2 className="account-panel-title">Public profile</h2>
        <label className="admin-field">
          <span>Display name</span>
          <input
            className="apply-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label className="admin-field">
          <span>Phone</span>
          <input
            className="apply-input"
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label className="admin-field">
          <span>Instagram</span>
          <input
            className="apply-input"
            value={form.instagramHandle ?? ''}
            onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
            placeholder="@handle"
          />
        </label>
        <label className="admin-field">
          <span>Short bio</span>
          <textarea
            className="apply-input admin-textarea"
            rows={3}
            value={form.bio ?? ''}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </label>
        <p className="account-muted">Login email: {form.email} — change in Settings</p>

        <h2 className="account-panel-title" style={{ marginTop: 24 }}>
          Payout — UPI
        </h2>
        <label className="admin-field">
          <span>UPI ID</span>
          <input
            className="apply-input"
            value={form.payoutUpi ?? ''}
            onChange={(e) => setForm({ ...form, payoutUpi: e.target.value })}
            placeholder="yourname@upi"
          />
        </label>

        <h2 className="account-panel-title" style={{ marginTop: 24 }}>
          Payout — bank account
        </h2>
        <p className="account-muted" style={{ marginBottom: 12 }}>
          Optional if you prefer bank transfer over UPI. Stored securely for ops payouts only.
        </p>
        <label className="admin-field">
          <span>Account holder name</span>
          <input
            className="apply-input"
            value={form.payoutAccountHolder ?? ''}
            onChange={(e) => setForm({ ...form, payoutAccountHolder: e.target.value })}
          />
        </label>
        <label className="admin-field">
          <span>Bank name</span>
          <input
            className="apply-input"
            value={form.payoutBankName ?? ''}
            onChange={(e) => setForm({ ...form, payoutBankName: e.target.value })}
          />
        </label>
        <label className="admin-field">
          <span>Account number</span>
          <input
            className="apply-input"
            value={form.payoutAccountNumber ?? ''}
            onChange={(e) => setForm({ ...form, payoutAccountNumber: e.target.value })}
            autoComplete="off"
          />
        </label>
        <label className="admin-field">
          <span>IFSC</span>
          <input
            className="apply-input"
            value={form.payoutIfsc ?? ''}
            onChange={(e) => setForm({ ...form, payoutIfsc: e.target.value })}
          />
        </label>

        <p className="account-muted" style={{ marginTop: 16 }}>
          {GLYPH.dot} Saved cards are not used for partner payouts — you receive commission, not pay by card.
        </p>

        {msg && <p className="account-msg">{msg}</p>}
        <button type="submit" className="admin-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile →'}
        </button>
      </form>

    </div>
  )
}
