import Link from 'next/link'
import { DESTINATIONS } from '@/constants/destinations'
import { ROUTES } from '@/constants/routes'
import { withPromoQuery } from '@/lib/promo'
import { formatPrice } from '@/lib/utils'
import type { DestinationCatalogRow } from '@/lib/destination-catalog'
import Reveal from '@/components/ui/Reveal'

type BatchesCatalogProps = {
  destinations: DestinationCatalogRow[]
  promoCode?: string
}

export default function BatchesCatalog({ destinations, promoCode }: BatchesCatalogProps) {
  return (
    <section className="batches-catalog">
      <div className="batches-catalog-track">
        {destinations.map((destination) => {
          const meta = DESTINATIONS[destination.slug]
          const matchUrl = withPromoQuery(ROUTES.matchForDestination(destination.slug), promoCode)
          const pillClass =
            destination.slug === 'udaipur' ? 'gold-pill' : destination.slug === 'himalayan' ? '' : ''

          return (
            <Reveal key={destination.slug} className="batches-catalog-item">
              <article
                className={`batches-catalog-card batches-catalog-card--${destination.catalogCardClass}`}
                style={{ '--batch-accent': destination.accentColor } as React.CSSProperties}
              >
                <div className={`batch-label-pill${pillClass ? ` ${pillClass}` : ''}`}>
                  ✦ {destination.stops} ✦
                </div>
                <h2 className="batches-catalog-card-title">
                  {destination.slug === 'himalayan' && (
                    <>
                      For the <em>unfiltered</em> ones.
                    </>
                  )}
                  {destination.slug === 'udaipur' && (
                    <>
                      For the <em>romantic</em> ones.
                    </>
                  )}
                </h2>
                <p className="batches-catalog-tagline">{destination.tagline}</p>
                <p className="batches-catalog-ages">{destination.ageSummary}</p>
                <p className="batches-catalog-price">
                  {destination.startingPrice != null ? (
                    <>
                      From <strong>{formatPrice(destination.startingPrice)}</strong>
                      <span className="batches-catalog-per"> / person</span>
                    </>
                  ) : (
                    <strong>Price coming soon</strong>
                  )}
                </p>
                <p className="batches-catalog-status">
                  {destination.status === 'open' && '12 boys · 12 girls · Spots open'}
                  {destination.status === 'coming_soon' && 'Coming soon'}
                  {destination.status === 'sold_out' && 'Sold out — join waitlist'}
                  {destination.status === 'waitlist' && 'Waitlist only'}
                </p>
                <Link
                  href={withPromoQuery(ROUTES.destinationDetail(destination.slug), promoCode)}
                  className="batches-catalog-cta"
                >
                  See the trip &amp; itinerary →
                </Link>
                <Link href={matchUrl} className="batches-catalog-secondary">
                  Or check your compatibility →
                </Link>
              </article>
            </Reveal>
          )
        })}
      </div>
      <p className="batches-catalog-foot">
        Every batch starts with the quiz — then pick your Friday and pay on togetha.club to confirm.
      </p>
      <p className="trust-microline">
        <span className="tm-mark" aria-hidden>
          ✦
        </span>
        Every traveller is hand-verified before they&apos;re confirmed.{' '}
        <strong>Can&apos;t verify you? Full refund.</strong>{' '}
        <Link href={ROUTES.safety}>See who gets in →</Link>
      </p>
    </section>
  )
}
