import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyInfluencer } from '@/lib/notifications'
import { parseDateOnly } from '@/lib/partner-trip-dates'

const PLACEHOLDER_BATCH = 'batch-a'
const DAILY_STORY_COUNT = 5

type DepartureRow = {
  departure_date: string | null
  return_date: string | null
  label: string
}

type ContentInsert = {
  influencer_id: string
  batch_slug: string
  departure_id?: string | null
  type: 'pre_trip' | 'daily_story' | 'post_trip'
  due_date: string | null
  scheduled_upload_date?: string | null
}

/** Idempotent — one default program per influencer, independent of trip booking. */
export async function ensureDefaultContentProgram(
  service: SupabaseClient,
  influencerId: string
): Promise<boolean> {
  const { count } = await service
    .from('content_items')
    .select('id', { count: 'exact', head: true })
    .eq('influencer_id', influencerId)

  if (count && count > 0) return false

  const items: ContentInsert[] = [
    {
      influencer_id: influencerId,
      batch_slug: PLACEHOLDER_BATCH,
      type: 'pre_trip',
      due_date: null,
      scheduled_upload_date: null,
    },
  ]

  for (let i = 0; i < DAILY_STORY_COUNT; i++) {
    items.push({
      influencer_id: influencerId,
      batch_slug: PLACEHOLDER_BATCH,
      type: 'daily_story',
      due_date: null,
    })
  }

  items.push({
    influencer_id: influencerId,
    batch_slug: PLACEHOLDER_BATCH,
    type: 'post_trip',
    due_date: null,
  })

  const { error } = await service.from('content_items').insert(items)
  if (error) {
    console.error('[ensureDefaultContentProgram]', error.message)
    return false
  }

  return true
}

/** Apply trip dates to an existing program after booking (Phase 1: preset departures). */
export async function attachTripDatesToContentProgram(
  service: SupabaseClient,
  input: {
    influencerId: string
    batchSlug: string
    batchName: string
    departureId?: string | null
    departure: DepartureRow
  }
): Promise<void> {
  const start = input.departure.departure_date
    ? parseDateOnly(String(input.departure.departure_date).slice(0, 10))
    : new Date(Date.now() + 14 * 86400000)
  const end = input.departure.return_date
    ? parseDateOnly(String(input.departure.return_date).slice(0, 10))
    : new Date(start.getTime() + 5 * 86400000)

  const { data: rows } = await service
    .from('content_items')
    .select('id, type')
    .eq('influencer_id', input.influencerId)
    .order('created_at', { ascending: true })

  if (!rows?.length) {
    await ensureDefaultContentProgram(service, input.influencerId)
    return attachTripDatesToContentProgram(service, input)
  }

  const dailyRows = rows.filter((r) => r.type === 'daily_story')
  const postRow = rows.find((r) => r.type === 'post_trip')

  const dayMs = 86400000
  let dayCount = 0
  for (let t = start.getTime(); t <= end.getTime() && dayCount < dailyRows.length; t += dayMs) {
    const due = new Date(t)
    due.setHours(23, 59, 0, 0)
    await service
      .from('content_items')
      .update({
        batch_slug: input.batchSlug,
        departure_id: input.departureId,
        due_date: due.toISOString(),
      })
      .eq('id', dailyRows[dayCount].id)
    dayCount++
  }

  if (postRow) {
    const postDue = new Date(end)
    postDue.setDate(postDue.getDate() + 5)
    await service
      .from('content_items')
      .update({
        batch_slug: input.batchSlug,
        departure_id: input.departureId,
        due_date: postDue.toISOString(),
      })
      .eq('id', postRow.id)
  }

  await service
    .from('content_items')
    .update({
      batch_slug: input.batchSlug,
      departure_id: input.departureId,
    })
    .eq('influencer_id', input.influencerId)
    .eq('type', 'pre_trip')

  await notifyInfluencer(service, {
    influencerId: input.influencerId,
    type: 'content_calendar',
    title: 'Trip dates added',
    body: `Your content calendar for ${input.batchName} now has trip dates.`,
  })
}

/** Legacy entry: ensure program exists, then attach trip dates. */
export async function seedContentItemsForTrip(
  service: SupabaseClient,
  input: {
    influencerId: string
    influencerName?: string
    batchSlug: string
    batchName: string
    departureId?: string | null
    departure: DepartureRow
  }
): Promise<void> {
  await ensureDefaultContentProgram(service, input.influencerId)
  await attachTripDatesToContentProgram(service, input)
}
