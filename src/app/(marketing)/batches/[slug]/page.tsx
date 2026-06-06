import { notFound } from 'next/navigation'
import BatchCard from '@/components/batches/BatchCard'
import BatchMatchCTA from '@/components/match/BatchMatchCTA'
import BatchCSection from '@/components/batches/BatchCSection'
import BatchBreadcrumb from '@/components/batches/BatchBreadcrumb'
import BatchSwitcher from '@/components/batches/BatchSwitcher'
import BatchVideoTestimonials from '@/components/batches/BatchVideoTestimonials'
import BatchProductFaq from '@/components/batches/BatchProductFaq'
import Reveal from '@/components/ui/Reveal'
import { BATCH_META } from '@/constants/batches'
import { getBatchVideoTestimonials } from '@/constants/batch-testimonials'
import {
  BATCH_A_DATES,
  BATCH_B_DATES,
  buildBatchFaq,
  buildBatchTabs,
} from '@/lib/batch-content'
import { fetchAllBatchDepartures } from '@/lib/batches'
import { fetchBatchesCatalog, FALLBACK_BATCHES } from '@/lib/batch-catalog'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/metadata'

const VALID_SLUGS = ['batch-a', 'batch-b', 'batch-c'] as const

type BatchSlug = (typeof VALID_SLUGS)[number]

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ promo?: string }>
}

function isBatchSlug(slug: string): slug is BatchSlug {
  return (VALID_SLUGS as readonly string[]).includes(slug)
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  if (!isBatchSlug(slug)) {
    return buildMetadata('Batches — Togetha.Club', 'View Himalayan love trail batches.')
  }
  const meta = BATCH_META[slug]
  return buildMetadata(
    `${meta.label} — Togetha.Club`,
    `${meta.tagline} Ages ${meta.ageRange}. India's first matchmaking travel club.`
  )
}

export async function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }))
}

export default async function BatchProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { promo } = await searchParams
  if (!isBatchSlug(slug)) notFound()

  const supabase = tryCreateServerSupabaseClient()
  const [batches, departureMap] = await Promise.all([
    fetchBatchesCatalog(),
    fetchAllBatchDepartures(supabase),
  ])

  const batch = batches.find((b) => b.slug === slug) ?? FALLBACK_BATCHES.find((b) => b.slug === slug)
  if (!batch) notFound()

  const meta = BATCH_META[slug]
  const breadcrumbLabel = `${meta.label} — ${slug === 'batch-c' ? 'Mystery' : `Love Trail ${slug.slice(-1).toUpperCase()}`}`
  const videoTestimonials = getBatchVideoTestimonials(slug)
  const faqItems = buildBatchFaq(slug)
  const roseAccent = slug === 'batch-b'

  if (slug === 'batch-c') {
    return (
      <div className="batch-product-page">
        <div className="product-page product-page--pdp">
          <BatchBreadcrumb label="Batch C — Mystery" />
          <BatchSwitcher batches={batches} currentSlug={slug} promoCode={promo} />
          <BatchCSection />
          <Reveal>
            <BatchVideoTestimonials items={videoTestimonials} accentColor={meta.accentColor} />
          </Reveal>
          {faqItems.length > 0 && (
            <Reveal>
              <BatchProductFaq items={faqItems} roseAccent={roseAccent} />
            </Reveal>
          )}
        </div>
      </div>
    )
  }

  const dateOptions =
    slug === 'batch-a'
      ? departureMap['batch-a']?.length
        ? departureMap['batch-a']
        : BATCH_A_DATES
      : departureMap['batch-b']?.length
        ? departureMap['batch-b']
        : BATCH_B_DATES

  return (
    <div className="batch-product-page">
      <div className="product-page product-page--pdp">
        <BatchBreadcrumb label={breadcrumbLabel} />
        <BatchSwitcher batches={batches} currentSlug={slug} promoCode={promo} />
        <Reveal>
          <BatchCard
            slug={batch.slug}
            name={batch.name}
            price={batch.price}
            status={batch.status}
            accentColor={BATCH_META[slug].accentColor}
            dateOptions={dateOptions}
            tabs={buildBatchTabs(slug)}
            promoCode={promo}
          />
        </Reveal>
        {(slug === 'batch-a' || slug === 'batch-b') && (
          <Reveal>
            <BatchMatchCTA batchSlug={slug} />
          </Reveal>
        )}
        <Reveal>
          <BatchVideoTestimonials items={videoTestimonials} accentColor={meta.accentColor} />
        </Reveal>
        <Reveal>
          <BatchProductFaq items={faqItems} roseAccent={roseAccent} />
        </Reveal>
      </div>
    </div>
  )
}
