'use client'

import { useCallback, useEffect, useState } from 'react'
import Badge from '@/components/ui/Badge'
import type { BatchStatus } from '@/types/batch'

interface AdminBatch {
  slug: string
  name: string
  price: number | null
  status: BatchStatus
  spotsTakenM: number
  spotsTakenF: number
  maxSpotsM: number
  maxSpotsF: number
  depositPercent: number
}

const STATUS_OPTIONS: BatchStatus[] = ['open', 'sold_out', 'waitlist', 'coming_soon']

export default function AdminBatchesManager() {
  const [batches, setBatches] = useState<AdminBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/batches')
    const json = await res.json()
    if (res.ok) setBatches(json.batches ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const saveBatch = async (batch: AdminBatch) => {
    setSaving(batch.slug)
    setMessage(null)
    const res = await fetch('/api/admin/batches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })
    const json = await res.json()
    if (!res.ok) {
      setMessage(json.error ?? 'Save failed')
    } else {
      setMessage(`Saved ${batch.slug}`)
      setBatches((prev) => prev.map((b) => (b.slug === batch.slug ? json.batch : b)))
    }
    setSaving(null)
  }

  const updateField = (slug: string, field: keyof AdminBatch, value: string | number | null) => {
    setBatches((prev) =>
      prev.map((b) => (b.slug === slug ? { ...b, [field]: value } : b))
    )
  }

  if (loading) return <p className="admin-muted">Loading batches…</p>

  return (
    <div className="admin-stack">
      {message && <p className="admin-msg">{message}</p>}

      {batches.map((batch) => (
        <div className="admin-panel" key={batch.slug}>
          <div className="admin-panel-head">
            <h2 className="admin-panel-title">{batch.name}</h2>
            <Badge color="teal">{batch.slug}</Badge>
          </div>

          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Display name</span>
              <input
                className="apply-input"
                value={batch.name}
                onChange={(e) => updateField(batch.slug, 'name', e.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Price (INR)</span>
              <input
                className="apply-input"
                type="number"
                value={batch.price ?? ''}
                onChange={(e) =>
                  updateField(batch.slug, 'price', e.target.value ? Number(e.target.value) : null)
                }
              />
            </label>

            <label className="admin-field">
              <span>Status</span>
              <select
                className="apply-select"
                value={batch.status}
                onChange={(e) => updateField(batch.slug, 'status', e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Deposit %</span>
              <input
                className="apply-input"
                type="number"
                min={0}
                max={100}
                value={batch.depositPercent}
                onChange={(e) => updateField(batch.slug, 'depositPercent', Number(e.target.value))}
              />
            </label>

            <label className="admin-field">
              <span>Spots taken (M / F)</span>
              <div className="admin-inline-inputs">
                <input
                  className="apply-input"
                  type="number"
                  min={0}
                  value={batch.spotsTakenM}
                  onChange={(e) => updateField(batch.slug, 'spotsTakenM', Number(e.target.value))}
                />
                <input
                  className="apply-input"
                  type="number"
                  min={0}
                  value={batch.spotsTakenF}
                  onChange={(e) => updateField(batch.slug, 'spotsTakenF', Number(e.target.value))}
                />
              </div>
            </label>

            <label className="admin-field">
              <span>Max spots (M / F)</span>
              <div className="admin-inline-inputs">
                <input
                  className="apply-input"
                  type="number"
                  min={0}
                  value={batch.maxSpotsM}
                  onChange={(e) => updateField(batch.slug, 'maxSpotsM', Number(e.target.value))}
                />
                <input
                  className="apply-input"
                  type="number"
                  min={0}
                  value={batch.maxSpotsF}
                  onChange={(e) => updateField(batch.slug, 'maxSpotsF', Number(e.target.value))}
                />
              </div>
            </label>
          </div>

          <div className="admin-panel-actions">
            <button
              type="button"
              className="admin-btn"
              disabled={saving === batch.slug}
              onClick={() => saveBatch(batch)}
            >
              {saving === batch.slug ? 'Saving…' : 'Save batch'}
            </button>
            <a href={`/admin/batches/${batch.slug}`} className="admin-inline-link">
              Manage departure dates →
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
