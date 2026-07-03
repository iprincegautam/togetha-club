'use client'

import { useCallback, useEffect, useState } from 'react'
import { GLYPH } from '@/constants/brand-glyphs'

interface Logistics {
  pickup_location: string | null
  vehicle_number: string | null
  reporting_time: string | null
  departure_time: string | null
  arrival_time: string | null
  guide_name: string | null
  guide_phone: string | null
  guide_email: string | null
}

function FieldList({ fields }: { fields: { label: string; value: string | null }[] }) {
  return (
    <ul className="account-card-list">
      {fields.map((field) => (
        <li key={field.label} className="account-card-list-item">
          <div>
            <strong>{field.label}</strong>
            <span className="account-muted" style={{ display: 'block' }}>
              {field.value || 'To be confirmed'}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function AccountLogisticsPage() {
  const [available, setAvailable] = useState(false)
  const [logistics, setLogistics] = useState<Logistics | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/account/logistics')
      .then((r) => r.json())
      .then((json) => {
        setAvailable(Boolean(json.available))
        setLogistics(json.logistics ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <p className="account-muted">Loading logistics…</p>

  const hasGuideInfo =
    logistics && (logistics.guide_name || logistics.guide_phone || logistics.guide_email)

  return (
    <div className="account-stack">
      <div className="account-panel">
        <p className="apply-eyebrow">
          {GLYPH.spark} Trip logistics {GLYPH.spark}
        </p>
        <h1 className="account-title">Logistics</h1>
        <p className="account-sub">
          Pickup point, vehicle, and your trip guide&apos;s contact details — shared once your
          profile is approved and your departure is confirmed.
        </p>
      </div>

      {available && logistics ? (
        <>
          <div className="account-panel">
            <h2 className="account-panel-title">Getting there</h2>
            <FieldList
              fields={[
                { label: 'Pickup location', value: logistics.pickup_location },
                { label: 'Reporting time', value: logistics.reporting_time },
                { label: 'Departure time', value: logistics.departure_time },
                { label: 'Vehicle number', value: logistics.vehicle_number },
              ]}
            />
          </div>

          <div className="account-panel">
            <h2 className="account-panel-title">Coming back</h2>
            <FieldList
              fields={[{ label: 'Arrival time', value: logistics.arrival_time }]}
            />
          </div>

          <div className="account-panel">
            <h2 className="account-panel-title">Your guide</h2>
            {hasGuideInfo ? (
              <FieldList
                fields={[
                  { label: 'Guide name', value: logistics.guide_name },
                  { label: 'Guide phone', value: logistics.guide_phone },
                  { label: 'Guide email', value: logistics.guide_email },
                ]}
              />
            ) : (
              <p className="account-muted">
                Assigned and shared here closer to departure — usually within 6 hours of
                boarding.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="account-panel">
          <h2 className="account-panel-title">Logistics locked</h2>
          <p className="account-muted">
            Trip logistics — pickup point, vehicle number, and guide contact — appear here once
            your profile is approved and your departure batch is confirmed. Check back closer to
            your trip date, or reach out on{' '}
            <a href="/contact-us" className="portal-link">
              support
            </a>{' '}
            if you have questions.
          </p>
        </div>
      )}
    </div>
  )
}
