'use client'

import { useState } from 'react'

export interface ItineraryTripView {
  key: string
  label: string
  node: React.ReactNode
}

export default function ItinerariesExplorer({ trips }: { trips: ItineraryTripView[] }) {
  const [index, setIndex] = useState(0)
  const current = trips[index] ?? trips[0]

  return (
    <div className="itin-explorer">
      <div className="itin-select-row">
        <span className="itin-select-label">Choose your trip</span>
        <div className="itin-select-wrap">
          <select
            className="itin-select"
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            aria-label="Choose your trip"
          >
            {trips.map((trip, i) => (
              <option key={trip.key} value={i}>
                {trip.label}
              </option>
            ))}
          </select>
          <span className="itin-select-caret" aria-hidden>
            ▾
          </span>
        </div>
      </div>

      <div key={current.key} className="itin-trip reveal visible">
        {current.node}
      </div>
    </div>
  )
}
