import { BOOKABLE_BATCH_SLUGS } from '@/constants/destinations'
import { batchPublicName } from '@/lib/batch-display'
import { BATCH_PRICE_FALLBACK_RUPEES } from '@/lib/batch-price-fallbacks'
import type { Batch, BatchStatus } from '@/types/batch'
import type { MatchableBatchSlug } from '@/types/match'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'

export type BatchCatalogRow = Pick<Batch, 'slug' | 'name' | 'price' | 'status'>

export const FALLBACK_BATCHES: BatchCatalogRow[] = BOOKABLE_BATCH_SLUGS.map((slug) => ({
  slug,
  name: batchPublicName(slug),
  price: BATCH_PRICE_FALLBACK_RUPEES[slug as MatchableBatchSlug],
  status: 'open' as const,
}))

export async function fetchBatchesCatalog(): Promise<BatchCatalogRow[]> {
  try {
    const supabase = tryCreateServerSupabaseClient()
    if (!supabase) return FALLBACK_BATCHES

    const { data, error } = await supabase
      .from('batches')
      .select('slug, name, price, status')
      .in('slug', [...BOOKABLE_BATCH_SLUGS])
      .order('slug')

    if (error || !data?.length) {
      return FALLBACK_BATCHES
    }

    return data.map((row) => ({
      slug: row.slug,
      name: row.name,
      price: row.price,
      status: row.status as BatchStatus,
    }))
  } catch {
    return FALLBACK_BATCHES
  }
}
