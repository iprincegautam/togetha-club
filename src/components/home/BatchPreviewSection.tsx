import Image from 'next/image'
import Reveal from '@/components/ui/Reveal'
import Link from 'next/link'
import SectionLabel from '@/components/ui/SectionLabel'
import { destinationCoverImage } from '@/constants/batch-gallery'
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
              const cover = destinationCoverImage(destination.slug)
              const defaultSlug = DESTINATIONS[destination.slug].genzSlug
              const shortDates = departureShortLists[defaultSlug] ?? ''
              const meta = buildDestinationTripMetaLine(destination.slug, shortDates)
              const stops = DESTINATIONS[destination.slug].stops

              return (
                <Link
                  key={destination.slug}
                  href={ROUTES.matchForDestination(destination.slug)}
                  className="tpc"
                >
                  <div className="tpc-vis">
                    {cover?.src ? (
                      <>
                        <Image
                          src={cover.src}
                          alt={cover.caption}
                          fill
                          sizes="(max-width: 700px) 100vw, 480px"
                          className="tpc-vis-image"
                          priority={destination.slug === 'himalayan'}
                        />
                        <span className="tpc-vis-label">{stops}</span>
                      </>
                    ) : null}
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
