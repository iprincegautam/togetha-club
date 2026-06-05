import Link from 'next/link'
import { BATCH_META } from '@/constants/batches'
import { ROUTES } from '@/constants/routes'
import { withPromoQuery } from '@/lib/promo'
import { formatPrice } from '@/lib/utils'
import type { BatchCatalogRow } from '@/lib/batch-catalog'
import Reveal from '@/components/ui/Reveal'

type BatchesCatalogProps = {
  batches: BatchCatalogRow[]
  promoCode?: string
}

function catalogCta(batch: BatchCatalogRow, promoCode?: string): { href: string; label: string } {
  if (batch.slug === 'batch-c' || batch.status === 'coming_soon') {
    return {
      href: withPromoQuery(ROUTES.batchDetail('batch-c'), promoCode),
      label: 'See mystery batch →',
    }
  }
  return {
    href: withPromoQuery(ROUTES.batchDetail(batch.slug), promoCode),
    label: 'View batch →',
  }
}

export default function BatchesCatalog({ batches, promoCode }: BatchesCatalogProps) {
  return (
    <section className="batches-catalog">
      <div className="batches-catalog-track">
        {batches.map((batch) => {
          const meta = BATCH_META[batch.slug as keyof typeof BATCH_META]
          const cta = catalogCta(batch, promoCode)
          const pillClass =
            batch.slug === 'batch-b'
              ? 'rose-pill'
              : batch.slug === 'batch-c'
                ? 'lavender-pill'
                : ''

          return (
            <Reveal key={batch.slug} className="batches-catalog-item">
              <article
                className={`batches-catalog-card batches-catalog-card--${batch.slug.replace('batch-', '')}`}
                style={{ '--batch-accent': meta?.color } as React.CSSProperties}
              >
                <div className={`batch-label-pill${pillClass ? ` ${pillClass}` : ''}`}>
                  ✦ {meta?.label ?? batch.slug} ✦
                </div>
                <h2 className="batches-catalog-card-title">
                  {batch.slug === 'batch-a' && (
                    <>
                      For the <em>unfiltered</em> ones.
                    </>
                  )}
                  {batch.slug === 'batch-b' && (
                    <>
                      For the <em>intentional</em> ones.
                    </>
                  )}
                  {batch.slug === 'batch-c' && (
                    <>
                      A <em>third</em> destination.
                    </>
                  )}
                </h2>
                <p className="batches-catalog-tagline">{meta?.tagline}</p>
                <p className="batches-catalog-ages">Ages {meta?.ageRange}</p>
                <p className="batches-catalog-price">
                  {batch.price != null ? (
                    <>
                      From <strong>{formatPrice(batch.price)}</strong>
                      <span className="batches-catalog-per"> / person</span>
                    </>
                  ) : (
                    <strong>Price revealed Aug 1</strong>
                  )}
                </p>
                <p className="batches-catalog-status">
                  {batch.status === 'open' && '12 boys · 12 girls · Spots open'}
                  {batch.status === 'coming_soon' && 'Waitlist open · Aug 2026'}
                  {batch.status === 'sold_out' && 'Sold out — join waitlist'}
                  {batch.status === 'waitlist' && 'Waitlist only'}
                </p>
                <Link href={cta.href} className="batches-catalog-cta">
                  {cta.label}
                </Link>
              </article>
            </Reveal>
          )
        })}
      </div>
      <p className="batches-catalog-foot">
        Not sure which fits?{' '}
        <Link href={`${ROUTES.home}#quiz`} className="batches-catalog-foot-link">
          Take the quiz
        </Link>{' '}
        on the homepage first.
      </p>
    </section>
  )
}
