'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { withPromoQuery } from '@/lib/promo'
import { slotBookingInstallmentLabel } from '@/lib/payment-plan'
import { formatPrice } from '@/lib/utils'
import type { BatchStatus } from '@/types/batch'
import BatchTabs from '@/components/batches/BatchTabs'
import DatePicker from '@/components/batches/DatePicker'
import BatchVisualCarousel from '@/components/batches/BatchVisualCarousel'
import { BATCH_GALLERY } from '@/constants/batch-gallery'

interface BatchCardProps {
  slug: string
  name: string
  price: number | null
  status: BatchStatus
  accentColor: string
  dateOptions: { label: string; sublabel: string; soldOut?: boolean }[]
  tabs: { id: string; label: string; content: React.ReactNode }[]
  promoCode?: string
}

const BATCH_CONFIG: Record<
  string,
  {
    genBadge: string
    tagline: string
    ratingText: string
    includes: string
    roseAccent: boolean
    infoClass?: string
    priceSectionClass?: string
    installmentColor?: string
    trustCheckColor?: string
    bookClass?: string
    trustItems: string[]
  }
> = {
  'batch-a': {
    genBadge: 'GenZ · Ages 20–27',
    tagline: '"Manali. Kasol. Sissu. Five nights of chaos, connection, and maybe something more."',
    ratingText: "India's first matchmaking travel experience",
    includes: 'Includes accommodation, all meals, transport Delhi↔Manali, activities & experiences',
    roseAccent: false,
    trustItems: [
      'Verified profiles only',
      'Secure Razorpay payment',
      'Book online · instant confirmation',
      '12 boys · 12 girls balance guaranteed',
    ],
  },
  'batch-b': {
    genBadge: 'Millennial · Ages 28–38',
    tagline: '"For the ones who\'ve done the apps and know what they actually want. No games. Just mountains and real people."',
    ratingText: "India's most intentional travel experience",
    includes: 'Premium accommodation, all meals, private transport, guided activities, curated experiences',
    roseAccent: true,
    infoClass: 'rose-bg',
    priceSectionClass: 'rose-bg',
    installmentColor: 'var(--rose)',
    trustCheckColor: 'var(--rose)',
    bookClass: 'rose',
    trustItems: [
      'Premium accommodation',
      'Private transport',
      'Book online · instant confirmation',
      '12M · 12F guaranteed',
    ],
  },
}

function ProductTitle({ slug }: { slug: string }) {
  if (slug === 'batch-a') {
    return (
      <>
        The Himalayan
        <br />
        Love Trail — A
      </>
    )
  }
  if (slug === 'batch-b') {
    return (
      <>
        The Himalayan
        <br />
        Love Trail — B
      </>
    )
  }
  return null
}

function statusBadge(status: BatchStatus, roseAccent: boolean): { label: string; className: string } {
  switch (status) {
    case 'open':
      return {
        label: roseAccent ? '♡ Spots Open' : '✦ Spots Open',
        className: roseAccent ? 'badge-open' : 'badge-open',
      }
    case 'sold_out':
      return { label: 'Sold Out', className: 'badge-sold' }
    case 'waitlist':
      return { label: 'Waitlist', className: 'badge-waitlist' }
    case 'coming_soon':
      return { label: 'Coming Soon', className: 'badge-waitlist' }
    default:
      return { label: '✦ Spots Open', className: 'badge-open' }
  }
}

export default function BatchCard({
  slug,
  price,
  status,
  accentColor,
  dateOptions,
  tabs,
  promoCode,
}: BatchCardProps) {
  const router = useRouter()
  const config = BATCH_CONFIG[slug] ?? BATCH_CONFIG['batch-a']
  const badge = statusBadge(status, config.roseAccent)

  const [selectedDate, setSelectedDate] = useState<number | null>(0)
  const gallerySlides = BATCH_GALLERY[slug] ?? BATCH_GALLERY['batch-a']

  return (
    <div className="product-card">
      <div className="product-hero">
        <div className="product-visual">
          <BatchVisualCarousel slides={gallerySlides} accentColor={accentColor} />
        </div>
        <div className={`product-info${config.infoClass ? ` ${config.infoClass}` : ''}`}>
          <div className="product-badges">
            <span className="badge badge-gen">{config.genBadge}</span>
            <span className={`badge ${badge.className}`} style={config.roseAccent && status === 'open' ? { background: 'var(--rose)' } : undefined}>
              {badge.label}
            </span>
            <span className="badge badge-limited">Only 12+12</span>
          </div>

          <h1 className="product-title">
            <ProductTitle slug={slug} />
          </h1>
          <p className="product-tagline">
            <em>{config.tagline}</em>
          </p>

          <div className="product-rating">
            <span className="stars">★★★★★</span>
            <span className="rating-text">{config.ratingText}</span>
          </div>

          {price !== null && (
            <div className={`price-section${config.priceSectionClass ? ` ${config.priceSectionClass}` : ''}`}>
              <div className="price-label">Trip investment</div>
              <div>
                <span className="price-main">{formatPrice(price)}</span>
                <span className="price-per">/ per person</span>
              </div>
              <div className="price-installment" style={config.installmentColor ? { color: config.installmentColor } : undefined}>
                {slotBookingInstallmentLabel(price)}
              </div>
              <div className="price-includes">{config.includes}</div>
            </div>
          )}

          <DatePicker
            options={dateOptions}
            value={selectedDate}
            onChange={setSelectedDate}
            accentColor={accentColor}
          />

          <div className="cta-stack">
            <button
              type="button"
              className={`btn-book${config.bookClass ? ` ${config.bookClass}` : ''}`}
              onClick={() => router.push(withPromoQuery(ROUTES.apply(slug), promoCode))}
            >
              ✦ Apply & Reserve My Spot →
            </button>
            <a href={ROUTES.batchDetail('batch-c')} className="btn-waitlist">
              ♡ Join the Waitlist Instead
            </a>
          </div>

          <div className="trust-row">
            {config.trustItems.map((item) => (
              <span className="trust-item" key={item}>
                <span
                  className="trust-check"
                  style={config.trustCheckColor ? { color: config.trustCheckColor } : undefined}
                >
                  ✓
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <BatchTabs batchId={slug.replace('batch-', '')} tabs={tabs} roseAccent={config.roseAccent} />
    </div>
  )
}
