import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyInfluencer } from '@/lib/notifications'

type DepartureRow = {
  departure_date: string | null
  return_date: string | null
  label: string
}

export async function seedContentItemsForTrip(
  service: SupabaseClient,
  input: {
    influencerId: string
    influencerName: string
    batchSlug: string
    batchName: string
    departureId: string
    departure: DepartureRow
  }
): Promise<void> {
  const start = input.departure.departure_date
    ? new Date(input.departure.departure_date)
    : new Date(Date.now() + 14 * 86400000)
  const end = input.departure.return_date
    ? new Date(input.departure.return_date)
    : new Date(start.getTime() + 5 * 86400000)

  const items: Array<{
    influencer_id: string
    batch_slug: string
    departure_id: string
    type: 'pre_trip' | 'daily_story' | 'post_trip'
    due_date: string | null
    scheduled_upload_date?: string | null
  }> = []

  // Announcement video — influencer picks their own post date (often well before travel).
  items.push({
    influencer_id: input.influencerId,
    batch_slug: input.batchSlug,
    departure_id: input.departureId,
    type: 'pre_trip',
    due_date: null,
    scheduled_upload_date: null,
  })

  const dayMs = 86400000
  let dayCount = 0
  for (let t = start.getTime(); t <= end.getTime() && dayCount < 5; t += dayMs) {
    const due = new Date(t)
    due.setHours(23, 59, 0, 0)
    items.push({
      influencer_id: input.influencerId,
      batch_slug: input.batchSlug,
      departure_id: input.departureId,
      type: 'daily_story',
      due_date: due.toISOString(),
    })
    dayCount++
  }

  const postDue = new Date(end)
  postDue.setDate(postDue.getDate() + 5)
  items.push({
    influencer_id: input.influencerId,
    batch_slug: input.batchSlug,
    departure_id: input.departureId,
    type: 'post_trip',
    due_date: postDue.toISOString(),
  })

  const { error } = await service.from('content_items').insert(items)
  if (error) {
    console.error('[seedContentItemsForTrip]', error.message)
    return
  }

  await notifyInfluencer(service, {
    influencerId: input.influencerId,
    type: 'content_calendar',
    title: 'Content calendar ready',
    body: `Your content calendar for ${input.batchName} is ready. Check your Content tab.`,
  })
}
