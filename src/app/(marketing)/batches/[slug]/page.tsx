import { notFound, redirect } from 'next/navigation'
import BatchCard from '@/components/batches/BatchCard'
import BatchMatchCTA from '@/components/match/BatchMatchCTA'
import BatchCSection from '@/components/batches/BatchCSection'
import BatchBreadcrumb from '@/components/batches/BatchBreadcrumb'
import BatchSwitcher from '@/components/batches/BatchSwitcher'
import BatchVideoTestimonials from '@/components/batches/BatchVideoTestimonials'
import BatchProductFaq from '@/components/batches/BatchProductFaq'
import Reveal from '@/components/ui/Reveal'
import { BATCH_META } from '@/constants/batches'
import {
  DESTINATIONS,
  getDefaultBatchForDestination,
  getDestinationForBatch,
  isBookableBatchSlug,
  isDestinationSlug,
  resolveRouteSlug,
} from '@/constants/destinations'
import { getBatchVideoTestimonials } from '@/constants/batch-testimonials'
import {
  BATCH_A_DATES,
  BATCH_B_DATES,
  BATCH_D_DATES,
  BATCH_E_DATES,
  buildBatchFaq,
  buildBatchTabs,
} from '@/lib/batch-content'
import { fetchAllBatchDepartures } from '@/lib/batches'
import { fetchBatchesCatalog, FALLBACK_BATCHES } from '@/lib/batch-catalog'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/metadata'
import type { MatchableBatchSlug } from '@/types/match'

const VALID_BATCH_SLUGS = ['batch-a', 'batch-b', 'batch-c', 'batch-d', 'batch-e'] as const
const VALID_ROUTE_SLUGS = [...VALID_BATCH_SLUGS, 'himalayan', 'udaipur'] as const

type RouteSlug = (typeof VALID_ROUTE_SLUGS)[number]

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ promo?: string }>
}

function isRouteSlug(slug: string): slug is RouteSlug {
  return (VALID_ROUTE_SLUGS as readonly string[]).includes(slug)
}

function resolveProductSlug(slug: string): MatchableBatchSlug | 'batch-c' | null {
  if (slug === 'batch-c') return 'batch-c'
  const resolved = resolveRouteSlug(slug)
  if (!resolved) return null
  return resolved
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const productSlug = resolveProductSlug(slug)
  if (!productSlug || productSlug === 'batch-c') {
    if (isDestinationSlug(slug)) {
      const meta = DESTINATIONS[slug]
      return buildMetadata(
        `${meta.title} — Togetha.Club`,
        `${meta.tagline} GenZ and Millennial editions. India's first matchmaking travel club.`
      )
    }
    return buildMetadata('Batches — Togetha.Club', 'View Togetha love trail batches.')
  }
  const meta = BATCH_META[productSlug]
  return buildMetadata(
    `${meta.label} — Togetha.Club`,
    `${meta.tagline} Ages ${meta.ageRange}. India's first matchmaking travel club.`
  )
}

export async function generateStaticParams() {
  return VALID_ROUTE_SLUGS.map((slug) => ({ slug }))
}

function dateOptionsForSlug(
  slug: MatchableBatchSlug,
  departureMap: Record<string, { label: string; sublabel: string; soldOut?: boolean }[]>
) {
  switch (slug) {
    case 'batch-a':
      return departureMap['batch-a']?.length ? departureMap['batch-a'] : BATCH_A_DATES
    case 'batch-b':
      return departureMap['batch-b']?.length ? departureMap['batch-b'] : BATCH_B_DATES
    case 'batch-d':
      return departureMap['batch-d']?.length ? departureMap['batch-d'] : BATCH_D_DATES
    case 'batch-e':
      return departureMap['batch-e']?.length ? departureMap['batch-e'] : BATCH_E_DATES
    default:
      return []
  }
}

export default async function BatchProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { promo } = await searchParams
  if (!isRouteSlug(slug)) notFound()

  if (isDestinationSlug(slug)) {
    redirect(`/batches/${getDefaultBatchForDestination(slug)}${promo ? `?promo=${promo}` : ''}`)
  }

  const productSlug = resolveProductSlug(slug)
  if (!productSlug) notFound()

  const supabase = tryCreateServerSupabaseClient()
  const [batches, departureMap] = await Promise.all([
    fetchBatchesCatalog(),
    fetchAllBatchDepartures(supabase),
  ])

  const batch =
    batches.find((b) => b.slug === productSlug) ??
    FALLBACK_BATCHES.find((b) => b.slug === productSlug)
  if (!batch && productSlug !== 'batch-c') notFound()

  if (productSlug === 'batch-c') {
    const meta = BATCH_META['batch-c']
    const videoTestimonials = getBatchVideoTestimonials('batch-c')
    const faqItems = buildBatchFaq('batch-c')
    return (
      <div className="batch-product-page">
        <div className="product-page product-page--pdp">
          <BatchBreadcrumb label="Batch C — Mystery" />
          <BatchCSection />
          <Reveal>
            <BatchVideoTestimonials items={videoTestimonials} accentColor={meta.accentColor} />
          </Reveal>
          {faqItems.length > 0 && (
            <Reveal>
              <BatchProductFaq items={faqItems} roseAccent={false} />
            </Reveal>
          )}
        </div>
      </div>
    )
  }

  if (!isBookableBatchSlug(productSlug)) notFound()

  const meta = BATCH_META[productSlug]
  const destination = getDestinationForBatch(productSlug)
  const destinationMeta = destination ? DESTINATIONS[destination] : null
  const breadcrumbLabel = destinationMeta
    ? `${destinationMeta.title} — ${meta.label}`
    : `${meta.label}`
  const videoTestimonials = getBatchVideoTestimonials(productSlug)
  const faqItems = buildBatchFaq(productSlug)
  const roseAccent = productSlug === 'batch-b' || productSlug === 'batch-e'
  const dateOptions = dateOptionsForSlug(productSlug, departureMap)

  return (
    <div className="batch-product-page">
      <div className="product-page product-page--pdp">
        <BatchBreadcrumb label={breadcrumbLabel} />
        <BatchSwitcher batches={batches} currentSlug={productSlug} promoCode={promo} />
        <Reveal>
          <BatchCard
            slug={batch!.slug}
            name={batch!.name}
            price={batch!.price}
            status={batch!.status}
            accentColor={BATCH_META[productSlug].accentColor}
            dateOptions={dateOptions}
            tabs={buildBatchTabs(productSlug)}
            promoCode={promo}
          />
        </Reveal>
        <Reveal>
          <BatchMatchCTA batchSlug={productSlug} destination={destination ?? undefined} />
        </Reveal>
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
