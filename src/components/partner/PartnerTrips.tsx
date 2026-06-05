'use client'

import { useEffect, useState } from 'react'
import Badge from '@/components/ui/Badge'

type Slot = {
  id: string
  batchName: string
  departureLabel: string | null
  departureDate: string | null
  guestName: string | null
  type: string
}

export default function PartnerTrips() {
  const [used, setUsed] = useState(0)
  const [limit, setLimit] = useState(2)
  const [slots, setSlots] = useState<Slot[]>([])
  const [departures, setDepartures] = useState<
    { id: string; batch_slug: string; label: string; spots_m: number; spots_taken_m: number; spots_f: number; spots_taken_f: number }[]
  >([])
  const [batchSlug, setBatchSlug] = useState('')
  const [departureId, setDepartureId] = useState('')
  const [guestSlot, setGuestSlot] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestConsent, setGuestConsent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const load = () => {
    fetch('/api/partner/trips')
      .then((r) => r.json())
      .then((json) => {
        setUsed(json.entitlement?.used ?? 0)
        setLimit(json.entitlement?.limit ?? 2)
        setSlots(json.slots ?? [])
        setDepartures(json.departures ?? [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const book = async () => {
    const res = await fetch('/api/partner/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchSlug, departureId }),
    })
    const json = await res.json()
    setMsg(res.ok ? 'Trip booked!' : (json.error ?? 'Failed'))
    if (res.ok) load()
  }

  const saveGuest = async (slotId: string) => {
    const res = await fetch('/api/partner/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, guestName, guestPhone, guestConsent }),
    })
    const json = await res.json()
    setMsg(res.ok ? 'Guest saved' : (json.error ?? 'Failed'))
    if (res.ok) {
      setGuestSlot(null)
      load()
    }
  }

  const depsForBatch = departures.filter((d) => d.batch_slug === batchSlug)

  if (loading) return <p className="account-muted">Loading…</p>

  return (
    <div className="account-stack">
      <div className="account-panel">
        <h1 className="account-title">My trips</h1>
        <div className="portal-entitlement-circles">
          <div className={`portal-circle filled`}>{used}</div>
          <div className="portal-circle empty">{Math.max(0, limit - used)}</div>
        </div>
        <p className="account-sub" style={{ textAlign: 'center' }}>
          {used} of {limit} complimentary trips used in 2026 · Resets 1 January 2027
        </p>
      </div>

      {slots.map((s) => (
        <div key={s.id} className="account-panel">
          <strong>{s.batchName}</strong>
          <p className="account-muted">{s.departureLabel}</p>
          <Badge>{s.type}</Badge>
          {s.guestName ? (
            <p>Plus-one: {s.guestName}</p>
          ) : (
            guestSlot !== s.id && (
              <button type="button" className="admin-link-btn" onClick={() => setGuestSlot(s.id)}>
                Register plus one
              </button>
            )
          )}
          {guestSlot === s.id && (
            <div style={{ marginTop: 12 }}>
              <input className="apply-input" placeholder="Guest name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
              <input className="apply-input" placeholder="Guest phone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} style={{ marginTop: 8 }} />
              <label style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input type="checkbox" checked={guestConsent} onChange={(e) => setGuestConsent(e.target.checked)} />
                Guest has consented to share details with Togetha.Club
              </label>
              <button type="button" className="apply-submit" style={{ marginTop: 8 }} onClick={() => saveGuest(s.id)}>
                Save guest
              </button>
            </div>
          )}
        </div>
      ))}

      {used < limit && (
        <div className="account-panel">
          <h2 className="account-panel-title">Select your complimentary trip</h2>
          <select className="apply-input" value={batchSlug} onChange={(e) => setBatchSlug(e.target.value)}>
            <option value="">Choose batch</option>
            {[...new Set(departures.map((d) => d.batch_slug))].map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </select>
          <select
            className="apply-input"
            style={{ marginTop: 8 }}
            value={departureId}
            onChange={(e) => setDepartureId(e.target.value)}
          >
            <option value="">Choose departure</option>
            {depsForBatch.map((d) => {
              const left = (d.spots_m - d.spots_taken_m) + (d.spots_f - d.spots_taken_f)
              return (
                <option key={d.id} value={d.id}>
                  {d.label} ({left} spots left)
                </option>
              )
            })}
          </select>
          <button type="button" className="apply-submit" style={{ marginTop: 12 }} disabled={!departureId} onClick={book}>
            Book this trip →
          </button>
        </div>
      )}
      {msg && <p className="account-msg">{msg}</p>}
    </div>
  )
}
