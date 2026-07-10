import type { MatchableBatchSlug } from '@/types/match'

/** Offline defaults when Supabase is unavailable — keep in sync with migrations. */
export const BATCH_PRICE_FALLBACK_RUPEES: Record<MatchableBatchSlug, number> = {
  'batch-a': 9999,
  'batch-b': 9999,
  'batch-d': 13999,
  'batch-e': 13999,
}

export function batchPriceFallbackRupees(slug: string): number {
  if (slug in BATCH_PRICE_FALLBACK_RUPEES) {
    return BATCH_PRICE_FALLBACK_RUPEES[slug as MatchableBatchSlug]
  }
  return BATCH_PRICE_FALLBACK_RUPEES['batch-a']
}

export function batchPriceFallbackPaise(slug: string): number {
  return batchPriceFallbackRupees(slug) * 100
}
