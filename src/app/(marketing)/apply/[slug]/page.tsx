import { notFound, redirect } from 'next/navigation'
import ApplyForm from '@/components/apply/ApplyForm'
import StampCircle from '@/components/ui/StampCircle'
import { BATCH_DATE_OPTIONS, BATCH_META } from '@/constants/batches'
import { ROUTES } from '@/constants/routes'
import { formatPrice } from '@/lib/utils'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/metadata'
import type { BatchStatus } from '@/types/batch'
import '@/components/apply/apply.css'

const VALID_SLUGS = ['batch-a', 'batch-b'] as const
type BatchSlug = (typeof VALID_SLUGS)[number]

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

const FALLBACK: Record<BatchSlug, { name: string; price: number; status: BatchStatus }> = {
  'batch-a': { name: 'The Himalayan Love Trail — A', price: 18999, status: 'open' },
  'batch-b': { name: 'The Himalayan Love Trail — B', price: 22999, status: 'open' },
}

async function fetchBatch(slug: BatchSlug) {
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
  searchParams: Promise<{ name?: string; email?: string; applicantId?: string }>
}) {
  const { slug } = await params
  const query = await searchParams

  if (!VALID_SLUGS.includes(slug as BatchSlug)) {
    notFound()
  }

  const batchSlug = slug as BatchSlug
  const batch = await fetchBatch(batchSlug)

  if (!batch || batch.status === 'waitlist' || batch.status === 'coming_soon') {
    redirect(ROUTES.batches)
  }

  if (batch.status === 'sold_out') {
    redirect(`${ROUTES.batches}#${batchSlug}`)
  }

  const meta = BATCH_META[batchSlug]
  const dateOptions = BATCH_DATE_OPTIONS[batchSlug] ?? []

  return (
    <div className="apply-page">
      <StampCircle
        text={<>Apply<br />Now<br />✦</>}
        color={meta.color}
        size={90}
        rotation={-12}
        className="apply-stamp apply-stamp-left"
      />
      <StampCircle
        text={<>♡<br />{formatPrice(batch.price)}</>}
        color={meta.color}
        size={80}
        rotation={10}
        className="apply-stamp apply-stamp-right"
      />

      <div className="apply-shell">
        <p className="apply-eyebrow">✦ {meta.label} ✦</p>
        <h1 className="apply-title">{batch.name}</h1>
        <p className="apply-sub">
          {formatPrice(batch.price)} per person · 3 steps to reserve your spot
        </p>

        <ApplyForm
          batchSlug={batchSlug}
          batchName={batch.name}
          batchPrice={batch.price}
          dateOptions={dateOptions}
          accentColor={meta.accentColor}
          roseAccent={batchSlug === 'batch-b'}
          initialName={query.name}
          initialEmail={query.email}
          applicantId={query.applicantId}
        />
      </div>
    </div>
  )
}
