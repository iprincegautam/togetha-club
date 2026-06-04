'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

interface ProfileFormState {
  fullName: string
  displayName: string
  avatarUrl: string
  phone: string
  city: string
  bio: string
  emergencyContact: string
  dietaryNotes: string
  instagramHandle: string
}

export default function AccountProfileForm() {
  const [form, setForm] = useState<ProfileFormState>({
    fullName: '',
    displayName: '',
    avatarUrl: '',
    phone: '',
    city: '',
    bio: '',
    emergencyContact: '',
    dietaryNotes: '',
    instagramHandle: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/account/me')
      .then((r) => r.json())
      .then((json) => {
        const p = json.profile
        if (p) {
          setForm({
            fullName: p.fullName ?? '',
            displayName: p.displayName ?? '',
            avatarUrl: p.avatarUrl ?? '',
            phone: p.phone ?? '',
            city: p.city ?? '',
            bio: p.bio ?? '',
            emergencyContact: p.emergencyContact ?? '',
            dietaryNotes: p.dietaryNotes ?? '',
            instagramHandle: p.instagramHandle ?? '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async (markKycSubmitted = false) => {
    setSaving(true)
    setMessage(null)
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, markKycSubmitted }),
    })
    const json = await res.json()
    if (!res.ok) {
      setMessage(json.error ?? 'Save failed')
    } else {
      setMessage(markKycSubmitted ? 'Profile submitted for review' : 'Profile saved')
    }
    setSaving(false)
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    setMessage(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/account/avatar', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) {
      setMessage(json.error ?? 'Upload failed')
    } else {
      setForm((f) => ({ ...f, avatarUrl: json.avatarUrl }))
      setMessage('Photo updated')
    }
    setUploading(false)
  }

  if (loading) return <p className="account-muted">Loading profile…</p>

  return (
    <div className="account-stack">
      <div className="account-panel">
        <h1 className="account-title">Your profile</h1>
        <p className="account-sub">
          Help us prepare for your trip. Nickname and photo are optional.
        </p>
        <p className="account-muted">
          <Link href={ROUTES.accountSettings}>Account settings</Link> (email, password, sign out)
        </p>
      </div>

      <form
        className="account-panel account-form"
        onSubmit={(e) => {
          e.preventDefault()
          save(true)
        }}
      >
        <div className="account-avatar-row">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="" className="account-avatar-preview" />
          ) : (
            <div className="account-avatar-placeholder">♡</div>
          )}
          <label className="admin-field" style={{ flex: 1 }}>
            <span>Profile photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="apply-input"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadPhoto(f)
              }}
            />
          </label>
        </div>
        <label className="admin-field">
          <span>Nickname</span>
          <input
            className="apply-input"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="What should we call you?"
          />
        </label>
        <label className="admin-field">
          <span>Full name (legal)</span>
          <input
            className="apply-input"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </label>
        <label className="admin-field">
          <span>Phone</span>
          <input
            className="apply-input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label className="admin-field">
          <span>City</span>
          <input
            className="apply-input"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </label>
        <label className="admin-field">
          <span>Instagram (optional)</span>
          <input
            className="apply-input"
            value={form.instagramHandle}
            onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
            placeholder="@handle"
          />
        </label>
        <label className="admin-field">
          <span>Short bio</span>
          <textarea
            className="apply-input admin-textarea"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="A line or two about you"
          />
        </label>
        <label className="admin-field">
          <span>Emergency contact</span>
          <input
            className="apply-input"
            value={form.emergencyContact}
            onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            placeholder="Name + phone"
          />
        </label>
        <label className="admin-field">
          <span>Dietary notes</span>
          <input
            className="apply-input"
            value={form.dietaryNotes}
            onChange={(e) => setForm({ ...form, dietaryNotes: e.target.value })}
            placeholder="Vegetarian, allergies, etc."
          />
        </label>

        {message && <p className="account-msg">{message}</p>}

        <div className="account-form-actions">
          <button type="button" className="account-btn-outline" disabled={saving} onClick={() => save(false)}>
            Save draft
          </button>
          <button type="submit" className="admin-btn" disabled={saving}>
            {saving ? 'Saving…' : 'Submit profile for review →'}
          </button>
        </div>
      </form>

      <p className="account-foot">
        <Link href={ROUTES.account} className="admin-inline-link">
          ← Back to booking
        </Link>
      </p>
    </div>
  )
}
