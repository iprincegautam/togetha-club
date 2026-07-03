'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'

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

interface DepartureLogistics {
  pickup_location: string | null
  vehicle_number: string | null
  reporting_time: string | null
  departure_time: string | null
  arrival_time: string | null
  guide_name: string | null
  guide_phone: string | null
  guide_email: string | null
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

const emptyLogisticsForm = {
  pickupLocation: '',
  vehicleNumber: '',
  reportingTime: '',
  departureTime: '',
  arrivalTime: '',
  guideName: '',
  guidePhone: '',
  guideEmail: '',
}

export default function AdminDeparturesManager({ batchSlug }: AdminDeparturesManagerProps) {
  const [departures, setDepartures] = useState<Departure[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [logisticsForm, setLogisticsForm] = useState(emptyLogisticsForm)
  const [logisticsLoading, setLogisticsLoading] = useState(false)
  const [logisticsMsg, setLogisticsMsg] = useState<string | null>(null)

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

  const toggleLogistics = async (dep: Departure) => {
    if (expandedId === dep.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(dep.id)
    setLogisticsMsg(null)
    setLogisticsLoading(true)
    const res = await fetch(`/api/admin/batches/${batchSlug}/departures/${dep.id}/logistics`)
    const json = await res.json()
    const l: DepartureLogistics | null = res.ok ? json.logistics : null
    setLogisticsForm({
      pickupLocation: l?.pickup_location ?? '',
      vehicleNumber: l?.vehicle_number ?? '',
      reportingTime: l?.reporting_time ?? '',
      departureTime: l?.departure_time ?? '',
      arrivalTime: l?.arrival_time ?? '',
      guideName: l?.guide_name ?? '',
      guidePhone: l?.guide_phone ?? '',
      guideEmail: l?.guide_email ?? '',
    })
    setLogisticsLoading(false)
  }

  const saveLogistics = async (departureId: string) => {
    setLogisticsMsg(null)
    const res = await fetch(
      `/api/admin/batches/${batchSlug}/departures/${departureId}/logistics`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logisticsForm),
      }
    )
    const json = await res.json()
    setLogisticsMsg(res.ok ? 'Logistics saved' : json.error ?? 'Failed to save logistics')
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
                <Fragment key={dep.id}>
                  <tr>
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
                        className="admin-link-btn"
                        onClick={() => toggleLogistics(dep)}
                      >
                        {expandedId === dep.id ? 'Hide logistics' : 'Edit logistics'}
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
                  {expandedId === dep.id && (
                    <tr>
                      <td colSpan={5}>
                        <div className="admin-panel" style={{ margin: '8px 0' }}>
                          <h3 className="admin-panel-title">Logistics — {dep.label}</h3>
                          {logisticsLoading ? (
                            <p className="admin-muted">Loading…</p>
                          ) : (
                            <>
                              <div className="admin-form-grid">
                                <label className="admin-field">
                                  <span>Pickup location</span>
                                  <input
                                    className="apply-input"
                                    value={logisticsForm.pickupLocation}
                                    onChange={(e) =>
                                      setLogisticsForm({
                                        ...logisticsForm,
                                        pickupLocation: e.target.value,
                                      })
                                    }
                                    placeholder="Akshardham Metro station, Delhi"
                                  />
                                </label>
                                <label className="admin-field">
                                  <span>Vehicle number</span>
                                  <input
                                    className="apply-input"
                                    value={logisticsForm.vehicleNumber}
                                    onChange={(e) =>
                                      setLogisticsForm({
                                        ...logisticsForm,
                                        vehicleNumber: e.target.value,
                                      })
                                    }
                                    placeholder="DL 1PC 1234"
                                  />
                                </label>
                                <label className="admin-field">
                                  <span>Reporting time</span>
                                  <input
                                    className="apply-input"
                                    value={logisticsForm.reportingTime}
                                    onChange={(e) =>
                                      setLogisticsForm({
                                        ...logisticsForm,
                                        reportingTime: e.target.value,
                                      })
                                    }
                                    placeholder="10:00 PM"
                                  />
                                </label>
                                <label className="admin-field">
                                  <span>Departure time</span>
                                  <input
                                    className="apply-input"
                                    value={logisticsForm.departureTime}
                                    onChange={(e) =>
                                      setLogisticsForm({
                                        ...logisticsForm,
                                        departureTime: e.target.value,
                                      })
                                    }
                                    placeholder="10:30 PM"
                                  />
                                </label>
                                <label className="admin-field">
                                  <span>Arrival time</span>
                                  <input
                                    className="apply-input"
                                    value={logisticsForm.arrivalTime}
                                    onChange={(e) =>
                                      setLogisticsForm({
                                        ...logisticsForm,
                                        arrivalTime: e.target.value,
                                      })
                                    }
                                    placeholder="Wednesday, 6:00 - 7:00 AM"
                                  />
                                </label>
                                <label className="admin-field">
                                  <span>Guide name</span>
                                  <input
                                    className="apply-input"
                                    value={logisticsForm.guideName}
                                    onChange={(e) =>
                                      setLogisticsForm({
                                        ...logisticsForm,
                                        guideName: e.target.value,
                                      })
                                    }
                                  />
                                </label>
                                <label className="admin-field">
                                  <span>Guide phone</span>
                                  <input
                                    className="apply-input"
                                    value={logisticsForm.guidePhone}
                                    onChange={(e) =>
                                      setLogisticsForm({
                                        ...logisticsForm,
                                        guidePhone: e.target.value,
                                      })
                                    }
                                  />
                                </label>
                                <label className="admin-field">
                                  <span>Guide email</span>
                                  <input
                                    className="apply-input"
                                    type="email"
                                    value={logisticsForm.guideEmail}
                                    onChange={(e) =>
                                      setLogisticsForm({
                                        ...logisticsForm,
                                        guideEmail: e.target.value,
                                      })
                                    }
                                  />
                                </label>
                              </div>
                              <button
                                type="button"
                                className="admin-btn"
                                style={{ marginTop: 12 }}
                                onClick={() => saveLogistics(dep.id)}
                              >
                                Save logistics
                              </button>
                              {logisticsMsg && <p className="admin-msg">{logisticsMsg}</p>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
