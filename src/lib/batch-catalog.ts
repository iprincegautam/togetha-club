import type { Batch, BatchStatus } from '@/types/batch'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'

export type BatchCatalogRow = Pick<Batch, 'slug' | 'name' | 'price' | 'status'>

export const FALLBACK_BATCHES: BatchCatalogRow[] = [
  { slug: 'batch-a', name: 'The Himalayan Love Trail — A', price: 18999, status: 'open' },
  { slug: 'batch-b', name: 'The Himalayan Love Trail — B', price: 22999, status: 'open' },
  { slug: 'batch-c', name: 'The Himalayan Love Trail — C', price: null, status: 'coming_soon' },
]

export async function fetchBatchesCatalog(): Promise<BatchCatalogRow[]> {
  try {
    const supabase = tryCreateServerSupabaseClient()
    if (!supabase) return FALLBACK_BATCHES

    const { data, error } = await supabase
      .from('batches')
      .select('slug, name, price, status')
      .in('slug', ['batch-a', 'batch-b', 'batch-c'])
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
