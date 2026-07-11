import Link from 'next/link'
import ItinerariesExplorer, {
  type ItineraryTripView,
} from '@/components/batches/ItinerariesExplorer'
import ItineraryAccordion from '@/components/batches/ItineraryAccordion'
import BatchVisualCarousel from '@/components/batches/BatchVisualCarousel'
import { DESTINATION_GALLERY } from '@/constants/batch-gallery'
import { buildBatchTabs, getBatchItinerary } from '@/lib/batch-content'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Itineraries — Togetha.Club',
    'Day-by-day itineraries for every Togetha trip — the Himalayan Love Trail (Manali · Kasol · Sissu) and the Udaipur Love Trail (Udaipur · Kumbhalgarh). See the route, the vibe, and what you leave with, then take the 2-minute compatibility quiz.',
    ROUTES.itineraries
  )
}

const QUIZ_NOTE = '2-minute quiz · we match you into your best-fit batch'

type TripConfig = {
  key: string
  slug: string
  dest: 'himalayan' | 'udaipur'
  label: string
  accent: string
  rose: boolean
}

const TRIPS: TripConfig[] = [
  {
    key: 'himalayan',
    slug: 'batch-a',
    dest: 'himalayan',
    label: 'Himalayan Love Trail · Manali · Kasol · Sissu · 5N/6D',
    accent: 'var(--teal)',
    rose: false,
  },
  {
    key: 'udaipur',
    slug: 'batch-d',
    dest: 'udaipur',
    label: 'Udaipur Love Trail · Udaipur · Kumbhalgarh · 2N/3D',
    accent: 'var(--rose)',
    rose: true,
  },
]

const OUTCOMES = [
  {
    icon: '♡',
    title: '23 people who still text back',
    desc: 'The batch becomes the group chat you actually reply to — long after the bus drops you home.',
  },
  {
    icon: '✦',
    title: 'Maybe a spark',
    desc: 'Off-grid, no filter, no pressure. No promises — but if it’s real, you’ll both know it.',
  },
  {
    icon: '❤',
    title: 'Stories you’ll tell for years',
    desc: 'The bonfire, the 2am drive, the conversation you didn’t want to end.',
  },
  {
    icon: '◈',
    title: 'Clarity on what you want',
    desc: 'Even if the whole takeaway is just knowing what you’re actually looking for.',
  },
]

function OutcomesBlock() {
  return (
    <section className="itin-outcomes">
      <div className="section-label">What you leave with</div>
      <h2 className="section-title">The part that outlasts the trip.</h2>
      <div className="itin-outcomes-grid">
        {OUTCOMES.map((o) => (
          <div className="itin-outcome-card" key={o.title}>
            <span className="itin-outcome-icon" aria-hidden>
              {o.icon}
            </span>
            <div className="itin-outcome-title">{o.title}</div>
            <div className="itin-outcome-desc">{o.desc}</div>
          </div>
        ))}
      </div>
      <p className="itin-outcomes-note">
        No outcome is promised. In our pilot batches, most people came home with at least one of
        these — and often more than they expected.
      </p>
    </section>
  )
}

function buildTripNode(trip: TripConfig): React.ReactNode {
  const tabs = buildBatchTabs(trip.slug)
  const content = (id: string) => tabs.find((t) => t.id === id)?.content ?? null
  const itinerary = getBatchItinerary(trip.slug)

  return (
    <>
      <div className="itin-gallery">
        <BatchVisualCarousel slides={DESTINATION_GALLERY[trip.dest]} accentColor={trip.accent} />
      </div>

      {itinerary && (
        <section className="itin-block">
          <ItineraryAccordion
            title={itinerary.title}
            days={itinerary.days}
            roseAccent={itinerary.roseAccent}
          />
        </section>
      )}
      <section className="itin-block">{content('whats-in')}</section>
      <section className="itin-block">{content('vibe')}</section>
      <OutcomesBlock />
      {content('reviews') && <section className="itin-block">{content('reviews')}</section>}

      <div className="itin-cta-row">
        <Link
          href={ROUTES.matchForDestination(trip.dest)}
          className={`btn-p${trip.rose ? ' rose' : ''}`}
        >
          Check your compatibility →
        </Link>
        <span className="itin-cta-note">{QUIZ_NOTE}</span>
      </div>
    </>
  )
}

export default function ItinerariesPage() {
  const trips: ItineraryTripView[] = TRIPS.map((trip) => ({
    key: trip.key,
    label: trip.label,
    node: buildTripNode(trip),
  }))

  return (
    <>
      <section className="page-hero">
        <p className="page-hero-eyebrow">✦ Itineraries ✦</p>
        <h1 className="page-hero-title">
          See exactly <span className="rose">where you&apos;ll go.</span>
        </h1>
        <p className="page-hero-sub">
          The full day-by-day for every Togetha trip — the route, the vibe, and what you leave
          with. No sign-up to look. When a trip feels like yours, take the 2-minute compatibility
          quiz and we&apos;ll match you into your best-fit batch.
        </p>
      </section>

      <div className="product-page">
        <ItinerariesExplorer trips={trips} />
      </div>
    </>
  )
}
