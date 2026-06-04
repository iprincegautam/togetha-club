import type { SupabaseClient } from '@supabase/supabase-js'
import { BATCH_DATE_OPTIONS } from '@/constants/batches'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'
import type { BatchStatus } from '@/types/batch'

export interface BatchRow {
  slug: string
  name: string
  price: number | null
  status: BatchStatus
  spots_taken_m: number
  spots_taken_f: number
  max_spots_m: number
  max_spots_f: number
  deposit_percent: number
  created_at?: string
}

export interface BatchDepartureRow {
  id: string
  batch_slug: string
  label: string
  sublabel: string | null
  departure_date: string | null
  return_date: string | null
  status: 'open' | 'sold_out' | 'cancelled'
  spots_m: number
  spots_f: number
  spots_taken_m: number
  spots_taken_f: number
  sort_order: number
}

export interface DateOption {
  id?: string
  label: string
  sublabel: string
  soldOut?: boolean
}

export function mapDepartureToDateOption(row: BatchDepartureRow): DateOption {
  const mFull = row.spots_taken_m >= row.spots_m
  const fFull = row.spots_taken_f >= row.spots_f
  return {
    id: row.id,
    label: row.label,
    sublabel: row.sublabel ?? '',
    soldOut: row.status === 'sold_out' || mFull || fFull,
  }
}

export async function fetchBatchDepartures(
  supabase: SupabaseClient | null,
  batchSlug: string
): Promise<DateOption[]> {
  if (!supabase) {
    return BATCH_DATE_OPTIONS[batchSlug] ?? []
  }

  try {
    const { data, error } = await supabase
      .from('batch_departures')
      .select('*')
      .eq('batch_slug', batchSlug)
      .neq('status', 'cancelled')
      .order('sort_order', { ascending: true })

    if (error || !data?.length) {
      return BATCH_DATE_OPTIONS[batchSlug] ?? []
    }

    return (data as BatchDepartureRow[]).map(mapDepartureToDateOption)
  } catch {
    return BATCH_DATE_OPTIONS[batchSlug] ?? []
  }
}

export async function fetchAllBatchDepartures(
  supabase: SupabaseClient | null
): Promise<Record<string, DateOption[]>> {
  const slugs = ['batch-a', 'batch-b']
  const entries = await Promise.all(
    slugs.map(async (slug) => [slug, await fetchBatchDepartures(supabase, slug)] as const)
  )
  return Object.fromEntries(entries)
}

export async function fetchBatchesForAdmin(service: SupabaseClient): Promise<BatchRow[]> {
  const { data, error } = await service
    .from('batches')
    .select(
      'slug, name, price, status, spots_taken_m, spots_taken_f, max_spots_m, max_spots_f, deposit_percent, created_at'
    )
    .order('slug')

  if (error || !data) return []
  return data as BatchRow[]
}

export async function fetchDeparturesForBatch(
  service: SupabaseClient,
  batchSlug: string
): Promise<BatchDepartureRow[]> {
  const { data, error } = await service
    .from('batch_departures')
    .select('*')
    .eq('batch_slug', batchSlug)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return data as BatchDepartureRow[]
}

export function mapBatchRow(row: BatchRow) {
  return {
    slug: row.slug,
    name: row.name,
    price: row.price,
    status: row.status,
    spotsTakenM: row.spots_taken_m,
    spotsTakenF: row.spots_taken_f,
    maxSpotsM: row.max_spots_m ?? 12,
    maxSpotsF: row.max_spots_f ?? 12,
    depositPercent: row.deposit_percent ?? 30,
  }
}
