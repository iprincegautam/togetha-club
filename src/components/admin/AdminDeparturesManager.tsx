'use client'

import { useCallback, useEffect, useState } from 'react'

interface Departure {
  id: string
  batch_slug: string
  label: string
  sublabel: string | null
  departure_date: string | null
  return_date: string | null
  status: 'open' | 'sold_out' | 'cancelled'
  spots_m: number
  spots_f: number
  spots_taken_m: number
  spots_taken_f: number
  sort_order: number
}

interface AdminDeparturesManagerProps {
  batchSlug: string
}

const emptyForm = {
  label: '',
  sublabel: '',
  departureDate: '',
  returnDate: '',
  spotsM: 12,
  spotsF: 12,
  sortOrder: 0,
}

export default function AdminDeparturesManager({ batchSlug }: AdminDeparturesManagerProps) {
  const [departures, setDepartures] = useState<Departure[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/batches/${batchSlug}/departures`)
    const json = await res.json()
    if (res.ok) setDepartures(json.departures ?? [])
    setLoading(false)
  }, [batchSlug])

  useEffect(() => {
    load()
  }, [load])

  const addDeparture = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    const res = await fetch(`/api/admin/batches/${batchSlug}/departures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: form.label,
        sublabel: form.sublabel,
        departureDate: form.departureDate || null,
        returnDate: form.returnDate || null,
        spotsM: form.spotsM,
        spotsF: form.spotsF,
        sortOrder: form.sortOrder,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setMessage(json.error ?? 'Failed to add')
      return
    }
    setForm(emptyForm)
    setMessage('Departure added')
    await load()
  }

  const updateDeparture = async (dep: Departure, patch: Partial<Departure>) => {
    const res = await fetch(`/api/admin/batches/${batchSlug}/departures/${dep.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: patch.label ?? dep.label,
        sublabel: patch.sublabel ?? dep.sublabel,
        departureDate: patch.departure_date ?? dep.departure_date,
        returnDate: patch.return_date ?? dep.return_date,
        status: patch.status ?? dep.status,
        spotsM: patch.spots_m ?? dep.spots_m,
        spotsF: patch.spots_f ?? dep.spots_f,
        sortOrder: patch.sort_order ?? dep.sort_order,
      }),
    })
    if (res.ok) await load()
  }

  const removeDeparture = async (id: string) => {
    if (!confirm('Delete this departure date?')) return
    await fetch(`/api/admin/batches/${batchSlug}/departures/${id}`, { method: 'DELETE' })
    await load()
  }

  if (loading) return <p className="admin-muted">Loading dates…</p>

  return (
    <div className="admin-stack">
      {message && <p className="admin-msg">{message}</p>}

      <form className="admin-panel" onSubmit={addDeparture}>
        <h2 className="admin-panel-title">Add departure date</h2>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Label</span>
            <input
              className="apply-input"
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Friday, 13 June 2026"
            />
          </label>
          <label className="admin-field">
            <span>Sublabel</span>
            <input
              className="apply-input"
              value={form.sublabel}
              onChange={(e) => setForm({ ...form, sublabel: e.target.value })}
              placeholder="Returns Wednesday, 18 June · 5N/6D"
            />
          </label>
          <label className="admin-field">
            <span>Departure date</span>
            <input
              className="apply-input"
              type="date"
              value={form.departureDate}
              onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
            />
          </label>
          <label className="admin-field">
            <span>Return date</span>
            <input
              className="apply-input"
              type="date"
              value={form.returnDate}
              onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
            />
          </label>
        </div>
        <button type="submit" className="admin-btn">
          Add date
        </button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Status</th>
              <th>Spots M/F</th>
              <th>Taken M/F</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departures.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  No departure dates yet.
                </td>
              </tr>
            ) : (
              departures.map((dep) => (
                <tr key={dep.id}>
                  <td>
                    <strong>{dep.label}</strong>
                    {dep.sublabel && <div className="admin-muted">{dep.sublabel}</div>}
                  </td>
                  <td>
                    <select
                      className="apply-select admin-filter-select"
                      value={dep.status}
                      onChange={(e) =>
                        updateDeparture(dep, { status: e.target.value as Departure['status'] })
                      }
                    >
                      <option value="open">open</option>
                      <option value="sold_out">sold_out</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                  <td>
                    {dep.spots_m} / {dep.spots_f}
                  </td>
                  <td>
                    {dep.spots_taken_m} / {dep.spots_taken_f}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-link-btn"
                      onClick={() =>
                        updateDeparture(dep, {
                          status: dep.status === 'sold_out' ? 'open' : 'sold_out',
                        })
                      }
                    >
                      Toggle sold out
                    </button>
                    {' · '}
                    <button
                      type="button"
                      className="admin-link-btn admin-danger"
                      onClick={() => removeDeparture(dep.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
