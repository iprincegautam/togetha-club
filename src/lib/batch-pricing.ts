import { BATCH_META } from '@/constants/batches'
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

const FALLBACK: BatchPricingRow[] = [
  {
    slug: 'batch-a',
    label: BATCH_META['batch-a'].label,
    ageRange: BATCH_META['batch-a'].ageRange,
    name: 'The Himalayan Love Trail — A',
    price: 18999,
    status: 'open',
    depositPercent: 30,
  },
  {
    slug: 'batch-b',
    label: BATCH_META['batch-b'].label,
    ageRange: BATCH_META['batch-b'].ageRange,
    name: 'The Himalayan Love Trail — B',
    price: 22999,
    status: 'open',
    depositPercent: 30,
  },
]

export async function fetchBatchPricing(): Promise<BatchPricingRow[]> {
  try {
    const supabase = tryCreateServerSupabaseClient()
    if (!supabase) return FALLBACK

    const { data, error } = await supabase
      .from('batches')
      .select('slug, name, price, status, deposit_percent')
      .in('slug', ['batch-a', 'batch-b'])
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
