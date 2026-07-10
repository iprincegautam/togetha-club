import { notFound, redirect } from 'next/navigation'
import ApplyFormLoader from '@/components/apply/ApplyFormLoader'
import StampCircle from '@/components/ui/StampCircle'
import { BATCH_META } from '@/constants/batches'
import { isBookableBatchSlug, isMillennialEdition } from '@/constants/destinations'
import { fetchBatchDepartures } from '@/lib/batches'
import { ROUTES } from '@/constants/routes'
import { formatPrice } from '@/lib/utils'
import { BATCH_PRICE_FALLBACK_RUPEES } from '@/lib/batch-price-fallbacks'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/metadata'
import type { BatchStatus } from '@/types/batch'
import type { MatchableBatchSlug } from '@/types/match'
import '@/components/apply/apply.css'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const meta = slug in BATCH_META ? BATCH_META[slug as keyof typeof BATCH_META] : null
  return buildMetadata(
    meta ? `Apply — ${meta.label} | Togetha.Club` : 'Apply | Togetha.Club',
    'Reserve your spot on a Togetha.Club matchmaking travel batch. 3 steps to apply and pay.'
  )
}

const FALLBACK: Record<MatchableBatchSlug, { name: string; price: number; status: BatchStatus }> = {
  'batch-a': { name: 'The Himalayan Love Trail — A', price: BATCH_PRICE_FALLBACK_RUPEES['batch-a'], status: 'open' },
  'batch-b': { name: 'The Himalayan Love Trail — B', price: BATCH_PRICE_FALLBACK_RUPEES['batch-b'], status: 'open' },
  'batch-d': { name: 'The Udaipur Love Trail — D', price: BATCH_PRICE_FALLBACK_RUPEES['batch-d'], status: 'open' },
  'batch-e': { name: 'The Udaipur Love Trail — E', price: BATCH_PRICE_FALLBACK_RUPEES['batch-e'], status: 'open' },
}

async function fetchBatch(slug: MatchableBatchSlug) {
  const supabase = tryCreateServerSupabaseClient()
  if (!supabase) return FALLBACK[slug]

  const { data, error } = await supabase
    .from('batches')
    .select('slug, name, price, status')
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return {
    name: data.name,
    price: data.price ?? FALLBACK[slug].price,
    status: data.status as BatchStatus,
  }
}

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    name?: string
    email?: string
    applicantId?: string
    promo?: string
    step?: string
    date?: string
  }>
}) {
  const { slug } = await params
  const query = await searchParams

  if (!isBookableBatchSlug(slug)) {
    notFound()
  }

  const batchSlug = slug
  const batch = await fetchBatch(batchSlug)

  if (!batch || batch.status === 'waitlist' || batch.status === 'coming_soon') {
    redirect(ROUTES.batches)
  }

  if (batch.status === 'sold_out') {
    redirect(ROUTES.batchDetail(batchSlug))
  }

  const meta = BATCH_META[batchSlug]
  const supabase = tryCreateServerSupabaseClient()
  const dateOptions = await fetchBatchDepartures(supabase, batchSlug)
  const previewStep =
    process.env.NODE_ENV === 'development' && (query.step === '2' || query.step === '3')
      ? (Number(query.step) as 2 | 3)
      : undefined
  const initialDateIndex =
    query.date != null && query.date !== '' && !Number.isNaN(Number(query.date))
      ? Number(query.date)
      : undefined

  return (
    <div className="apply-page">
      <StampCircle
        text={<>Apply<br />Now<br />✦</>}
        color={meta.color}
        size={90}
        rotation={-12}
        opacity={0.35}
        className="apply-stamp apply-stamp-left"
      />
      <StampCircle
        text={<>♡<br />{formatPrice(batch.price)}</>}
        color={meta.color}
        size={80}
        rotation={10}
        opacity={0.35}
        className="apply-stamp apply-stamp-right"
      />

      <div className="apply-shell">
        <p className="apply-eyebrow">✦ {meta.label} ✦</p>
        <h1 className="apply-title">{batch.name}</h1>
        <p className="apply-sub">
          {formatPrice(batch.price)} per person
          {batchSlug === 'batch-d' || batchSlug === 'batch-e' ? ' · GST included' : ''}
          {' · 3 steps to reserve your spot'}
        </p>

        <ApplyFormLoader
          batchSlug={batchSlug}
          batchName={batch.name}
          batchPrice={batch.price}
          dateOptions={dateOptions}
          accentColor={meta.accentColor}
          roseAccent={isMillennialEdition(batchSlug)}
          initialName={query.name}
          initialEmail={query.email}
          applicantId={query.applicantId}
          initialPromoCode={query.promo}
          previewStep={previewStep}
          initialDateIndex={initialDateIndex}
        />
      </div>
    </div>
  )
}
