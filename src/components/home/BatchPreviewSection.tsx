import Reveal from '@/components/ui/Reveal'
import Link from 'next/link'
import SectionLabel from '@/components/ui/SectionLabel'
import { DESTINATIONS, type DestinationSlug } from '@/constants/destinations'
import { ROUTES } from '@/constants/routes'
import { buildDestinationTripMetaLine } from '@/constants/destinations'
import { formatPrice } from '@/lib/utils'
import type { DestinationCatalogRow } from '@/lib/destination-catalog'
import type { BatchStatus } from '@/types/batch'

interface BatchPreviewSectionProps {
  destinations: DestinationCatalogRow[]
  departureShortLists: Record<string, string>
}

const DESTINATION_DISPLAY: Record<
  DestinationSlug,
  {
    statusClass: string
    priceClass: string
    ctaClass: string
  }
> = {
  himalayan: {
    statusClass: 'tb-teal',
    priceClass: '',
    ctaClass: '',
  },
  udaipur: {
    statusClass: 'tb-rose',
    priceClass: 'tpc-price-rose',
    ctaClass: 'tpc-cta-rose',
  },
}

function HimalayanVisual() {
  return (
    <svg viewBox="0 0 480 190" xmlns="http://www.w3.org/2000/svg">
      <rect width="480" height="190" fill="#D4E9F7" />
      <circle cx="400" cy="48" r="30" fill="#F9D54A" opacity="0.9" />
      <circle cx="400" cy="48" r="22" fill="#FCEA7E" />
      <polygon points="0,144 68,76 128,108 186,80 244,124 302,86 360,114 420,80 480,100 480,190 0,190" fill="#4A8B5C" opacity="0.9" />
      <rect x="0" y="162" width="480" height="28" fill="#3D7A49" />
      <text x="14" y="183" fontFamily="Georgia" fontStyle="italic" fontSize="8.5" fill="rgba(44,24,16,0.38)">Manali · Kasol · Sissu</text>
    </svg>
  )
}

function UdaipurVisual() {
  return (
    <svg viewBox="0 0 480 190" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="udaipur-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCE4B8" />
          <stop offset="100%" stopColor="#D4516A" />
        </linearGradient>
      </defs>
      <rect width="480" height="190" fill="url(#udaipur-sky)" />
      <ellipse cx="240" cy="150" rx="220" ry="24" fill="#6B8CAE" opacity="0.85" />
      <polygon points="180,150 220,90 260,150" fill="#F5E6C8" />
      <polygon points="250,150 300,70 350,150" fill="#E8DFC8" />
      <text x="14" y="183" fontFamily="Georgia" fontStyle="italic" fontSize="8.5" fill="rgba(44,24,16,0.45)">Udaipur · Kumbhalgarh</text>
    </svg>
  )
}

function statusLabel(status: BatchStatus): string {
  switch (status) {
    case 'open':
      return '✦ Spots Open'
    case 'sold_out':
      return 'Sold Out'
    case 'waitlist':
      return 'Waitlist'
    case 'coming_soon':
      return 'Coming Soon'
    default:
      return '✦ Spots Open'
  }
}

export default function BatchPreviewSection({
  destinations,
  departureShortLists,
}: BatchPreviewSectionProps) {
  return (
    <Reveal>
      <section className="sec" id="batches" style={{ background: 'var(--paper)' }}>
        <div className="sec-inner">
          <SectionLabel>The Batches</SectionLabel>
          <h2 className="sec-title">
            Choose your <span className="t">destination.</span>
          </h2>
          <p className="sec-sub">
            Himalayan or Udaipur — each with GenZ and Millennial editions. Take the quiz to check your fit.
          </p>
          <div className="trips-grid">
            {destinations.map((destination) => {
              const display = DESTINATION_DISPLAY[destination.slug]
              const Visual = destination.slug === 'udaipur' ? UdaipurVisual : HimalayanVisual
              const defaultSlug = DESTINATIONS[destination.slug].genzSlug
              const shortDates = departureShortLists[defaultSlug] ?? ''
              const meta = buildDestinationTripMetaLine(destination.slug, shortDates)

              return (
                <Link
                  key={destination.slug}
                  href={ROUTES.matchForDestination(destination.slug)}
                  className="tpc"
                >
                  <div className="tpc-vis">
                    <Visual />
                  </div>
                  <div className="tpc-body">
                    <div className="tpc-badges">
                      <span className="tb tb-dark">{destination.ageSummary}</span>
                      <span className={`tb ${display.statusClass}`}>
                        {statusLabel(destination.status)}
                      </span>
                    </div>
                    <div className="tpc-title">{destination.title}</div>
                    <div className="tpc-meta">{meta}</div>
                    {destination.startingPrice !== null && (
                      <div className={`tpc-price ${display.priceClass}`}>
                        From {formatPrice(destination.startingPrice)}
                        <span className="tpc-price-per">per person</span>
                      </div>
                    )}
                    <div className={`tpc-cta ${display.ctaClass}`}>
                      Check my fit in Our AI →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="batch-waitlist-wrap">
            <Link href={ROUTES.batches} className="batch-waitlist-link">
              ✦ View all destinations & editions →
            </Link>
          </div>
        </div>
      </section>
    </Reveal>
  )
}
