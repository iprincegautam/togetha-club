import { BATCH_META } from '@/constants/batches'
import { BOOKABLE_BATCH_SLUGS } from '@/constants/destinations'
import { BATCH_PRICE_FALLBACK_RUPEES } from '@/lib/batch-price-fallbacks'
import type { MatchableBatchSlug } from '@/types/match'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'

export interface BatchPricingRow {
  slug: string
  label: string
  ageRange: string
  name: string
  price: number | null
  status: string
  depositPercent: number
}

const FALLBACK: BatchPricingRow[] = BOOKABLE_BATCH_SLUGS.map((slug) => ({
  slug,
  label: BATCH_META[slug].label,
  ageRange: BATCH_META[slug].ageRange,
  name:
    slug === 'batch-a'
      ? 'The Himalayan Love Trail — A'
      : slug === 'batch-b'
        ? 'The Himalayan Love Trail — B'
        : slug === 'batch-d'
          ? 'The Udaipur Love Trail — D'
          : 'The Udaipur Love Trail — E',
  price: BATCH_PRICE_FALLBACK_RUPEES[slug as MatchableBatchSlug],
  status: 'open',
  depositPercent: 30,
}))

export async function fetchBatchPricing(): Promise<BatchPricingRow[]> {
  try {
    const supabase = tryCreateServerSupabaseClient()
    if (!supabase) return FALLBACK

    const { data, error } = await supabase
      .from('batches')
      .select('slug, name, price, status, deposit_percent')
      .in('slug', ['batch-a', 'batch-b', 'batch-d', 'batch-e'])
      .order('slug')

    if (error || !data?.length) return FALLBACK

    return data.map((row) => {
      const meta = BATCH_META[row.slug as keyof typeof BATCH_META]
      return {
        slug: row.slug,
        label: meta?.label ?? row.slug,
        ageRange: meta?.ageRange ?? '',
        name: row.name,
        price: row.price,
        status: row.status,
        depositPercent: row.deposit_percent ?? 30,
      }
    })
  } catch {
    return FALLBACK
  }
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}
