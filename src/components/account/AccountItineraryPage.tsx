import { IncludesTab, ItineraryTab } from '@/components/batches/BatchTabPanels'
import { getBatchItineraryPresentation } from '@/lib/batch-trip-data'
import type { MatchableBatchSlug } from '@/types/match'
import '@/components/batches/batches.css'

type AccountItineraryPageProps = {
  batchSlug: MatchableBatchSlug
  batchName: string | null
}

export default function AccountItineraryPage({ batchSlug, batchName }: AccountItineraryPageProps) {
  const trip = getBatchItineraryPresentation(batchSlug)

  return (
    <div className="account-stack account-itinerary">
      <div className="account-panel">
        <p className="apply-eyebrow">✦ Your trip ✦</p>
        <h1 className="account-title">Itinerary</h1>
        {batchName ? <p className="account-sub">{batchName}</p> : null}
        <p className="account-sub">
          Full day-by-day plan, inclusions, and exclusions for your Himalayan batch.
        </p>
      </div>

      <div className="account-panel account-itinerary-section">
        <ItineraryTab
          title={trip.itineraryTitle}
          days={trip.itinerary}
          roseAccent={trip.roseAccent}
        />
      </div>

      <div className="account-panel account-itinerary-section">
        <IncludesTab
          label={trip.includesLabel}
          title={trip.includesTitle}
          items={trip.includes}
          notIncluded={trip.notIncluded}
        />
      </div>
    </div>
  )
}
