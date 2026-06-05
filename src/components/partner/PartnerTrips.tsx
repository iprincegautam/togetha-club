'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { ROUTES } from '@/constants/routes'
import { formatTripDateRange, parseDateOnly, validateCustomFridayStart } from '@/lib/partner-trip-dates'

type Slot = {
  id: string
  batchName: string
  departureLabel: string | null
  departureDate: string | null
  returnDate: string | null
  status: string
  bookingMode: string
  guestName: string | null
  type: string
}

type Eligibility = {
  canBook: boolean
  reason: string
  warning: string | null
  daysUntilLock: number | null
  nextEligibleUntil: string | null
  completedTrips: number
  activeTrips: number
  used: number
  limit: number
}

type Batch = { slug: string; name: string; status: string }

export default function PartnerTrips() {
  const [portalUnlocked, setPortalUnlocked] = useState(false)
  const [eligibility, setEligibility] = useState<Eligibility | null>(null)
  const [used, setUsed] = useState(0)
  const [limit, setLimit] = useState(2)
  const [slots, setSlots] = useState<Slot[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [departures, setDepartures] = useState<
    { id: string; batch_slug: string; label: string; spots_m: number; spots_taken_m: number; spots_f: number; spots_taken_f: number }[]
  >([])
  const [upcomingFridays, setUpcomingFridays] = useState<string[]>([])
  const [bookingMode, setBookingMode] = useState<'preset' | 'custom'>('preset')
  const [batchSlug, setBatchSlug] = useState('')
  const [departureId, setDepartureId] = useState('')
  const [fridayStart, setFridayStart] = useState('')
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
        setPortalUnlocked(Boolean(json.portalUnlocked))
        setEligibility(json.eligibility ?? null)
        setUsed(json.entitlement?.used ?? 0)
        setLimit(json.entitlement?.limit ?? 2)
        setSlots(json.slots ?? [])
        setBatches(json.availableBatches ?? [])
        setDepartures(json.departures ?? [])
        setUpcomingFridays(json.upcomingFridays ?? [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const customPreview = useMemo(() => {
    if (!fridayStart) return null
    try {
      const { start, end } = validateCustomFridayStart(fridayStart)
      return formatTripDateRange(start, end)
    } catch {
      return null
    }
  }, [fridayStart])

  const depsForBatch = departures.filter((d) => d.batch_slug === batchSlug)

  const book = async () => {
    const payload =
      bookingMode === 'custom'
        ? { bookingMode: 'custom', batchSlug, fridayStart }
        : { bookingMode: 'preset', batchSlug, departureId }

    const res = await fetch('/api/partner/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setMsg(res.ok ? 'Trip booked!' : (json.error ?? 'Failed'))
    if (res.ok) {
      setDepartureId('')
      setFridayStart('')
      load()
    }
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

  const canSubmitBook =
    eligibility?.canBook &&
    batchSlug &&
    (bookingMode === 'preset' ? departureId : fridayStart && customPreview)

  if (loading) return <p className="account-muted">Loading…</p>

  if (!portalUnlocked) {
    return (
      <div className="account-stack">
        <div className="account-panel portal-lock-panel">
          <h1 className="account-title">My trips</h1>
          <p className="portal-lock-message" style={{ marginTop: 12 }}>
            🔒 Complimentary trips unlock after your <strong>Announcement</strong> is approved.
          </p>
          <Link href={ROUTES.partnerContent} className="apply-submit" style={{ display: 'inline-block', marginTop: 16 }}>
            Go to Content →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="account-stack">
      <div className="account-panel">
        <h1 className="account-title">My trips</h1>
        <div className="portal-entitlement-circles">
          <div className="portal-circle filled">{used}</div>
          <div className="portal-circle empty">{Math.max(0, limit - used)}</div>
        </div>
        <p className="account-sub" style={{ textAlign: 'center' }}>
          {used} of {limit} complimentary trips used · {eligibility?.completedTrips ?? 0} completed
        </p>
        {eligibility && (
          <p className={`account-muted${eligibility.canBook ? '' : ''}`} style={{ textAlign: 'center', marginTop: 8 }}>
            {eligibility.reason}
          </p>
        )}
        {eligibility?.warning && (
          <p className="portal-lock-message" style={{ marginTop: 12, borderColor: 'var(--rose)' }}>
            ⚠ {eligibility.warning}
          </p>
        )}
      </div>

      {slots.map((s) => (
        <div key={s.id} className="account-panel">
          <strong>{s.batchName}</strong>
          <p className="account-muted">{s.departureLabel}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <Badge>{s.type}</Badge>
            <Badge>{s.status}</Badge>
            {s.bookingMode === 'custom' && <Badge>Custom dates</Badge>}
          </div>
          {s.guestName ? (
            <p style={{ marginTop: 8 }}>Plus-one: {s.guestName}</p>
          ) : (
            s.status === 'confirmed' &&
            guestSlot !== s.id && (
              <button type="button" className="admin-link-btn" style={{ marginTop: 8 }} onClick={() => setGuestSlot(s.id)}>
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

      {eligibility?.canBook && (
        <div className="account-panel">
          <h2 className="account-panel-title">Book a complimentary trip</h2>
          <div className="portal-tabs" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={`portal-tab${bookingMode === 'preset' ? ' active' : ''}`}
              onClick={() => setBookingMode('preset')}
            >
              Scheduled batch
            </button>
            <button
              type="button"
              className={`portal-tab${bookingMode === 'custom' ? ' active' : ''}`}
              onClick={() => setBookingMode('custom')}
            >
              Pick my dates
            </button>
          </div>

          <select className="apply-input" value={batchSlug} onChange={(e) => setBatchSlug(e.target.value)}>
            <option value="">Choose batch</option>
            {batches.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>

          {bookingMode === 'preset' ? (
            <select
              className="apply-input"
              style={{ marginTop: 8 }}
              value={departureId}
              onChange={(e) => setDepartureId(e.target.value)}
            >
              <option value="">Choose departure</option>
              {depsForBatch.map((d) => {
                const left = d.spots_m - d.spots_taken_m + (d.spots_f - d.spots_taken_f)
                return (
                  <option key={d.id} value={d.id}>
                    {d.label} ({left} spots left)
                  </option>
                )
              })}
            </select>
          ) : (
            <div style={{ marginTop: 8 }}>
              <label className="account-muted" style={{ display: 'block', marginBottom: 6, fontSize: '0.88rem' }}>
                Start on a Friday (return is auto-set to the following Wednesday)
              </label>
              <select className="apply-input" value={fridayStart} onChange={(e) => setFridayStart(e.target.value)}>
                <option value="">Choose a Friday</option>
                {upcomingFridays.map((f) => (
                  <option key={f} value={f}>
                    {parseDateOnly(f).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </option>
                ))}
              </select>
              {customPreview && (
                <p className="account-muted" style={{ marginTop: 8 }}>
                  Your trip: <strong>{customPreview}</strong>
                </p>
              )}
            </div>
          )}

          <button type="button" className="apply-submit" style={{ marginTop: 12 }} disabled={!canSubmitBook} onClick={book}>
            Book this trip →
          </button>
        </div>
      )}

      {msg && <p className="account-msg">{msg}</p>}
    </div>
  )
}
