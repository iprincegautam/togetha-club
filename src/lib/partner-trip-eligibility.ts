import type { SupabaseClient } from '@supabase/supabase-js'
import { addSixMonths, daysUntil, parseDateOnly } from '@/lib/partner-trip-dates'

const FREE_TRIP_LIMIT = 2
const WARNING_DAYS = 14

type InfluencerRow = {
  id: string
  portal_unlocked?: boolean | null
  free_trips_used_this_year?: number | null
  last_trip_completed_at?: string | null
  next_trip_eligible_until?: string | null
}

type TripSlotRow = {
  id: string
  status: string
  return_date?: string | null
  departure_date?: string | null
  completed_at?: string | null
}

export type TripBookingEligibility = {
  canBook: boolean
  reason: string
  warning: string | null
  daysUntilLock: number | null
  nextEligibleUntil: string | null
  completedTrips: number
  activeTrips: number
  used: number
  limit: number
}

export async function autoCompletePastTrips(
  service: SupabaseClient,
  influencerId: string
): Promise<number> {
  const today = formatToday()
  const { data: slots } = await service
    .from('partner_trip_slots')
    .select('id, return_date, departure_date, status')
    .eq('influencer_id', influencerId)
    .eq('status', 'confirmed')

  let completed = 0
  for (const slot of slots ?? []) {
    const returnDate = slot.return_date ?? slot.departure_date
    if (!returnDate || returnDate >= today) continue
    await markTripSlotCompleted(service, influencerId, slot.id)
    completed++
  }
  return completed
}

function formatToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function markTripSlotCompleted(
  service: SupabaseClient,
  influencerId: string,
  slotId: string
): Promise<void> {
  const now = new Date().toISOString()
  const eligibleUntil = addSixMonths(new Date()).toISOString()

  await service
    .from('partner_trip_slots')
    .update({ status: 'completed', completed_at: now })
    .eq('id', slotId)
    .eq('influencer_id', influencerId)

  await service
    .from('influencers')
    .update({
      last_trip_completed_at: now,
      next_trip_eligible_until: eligibleUntil,
    })
    .eq('id', influencerId)
}

export function computeTripBookingEligibility(
  influencer: InfluencerRow,
  slots: TripSlotRow[]
): TripBookingEligibility {
  const used = influencer.free_trips_used_this_year ?? 0
  const limit = FREE_TRIP_LIMIT
  const completedTrips = slots.filter((s) => s.status === 'completed').length
  const activeTrips = slots.filter((s) => s.status === 'confirmed').length
  const nextEligibleUntil = influencer.next_trip_eligible_until ?? null

  const base = {
    completedTrips,
    activeTrips,
    used,
    limit,
    nextEligibleUntil,
    daysUntilLock: null as number | null,
    warning: null as string | null,
  }

  if (!influencer.portal_unlocked) {
    return {
      ...base,
      canBook: false,
      reason: 'Get your announcement approved in Content first.',
    }
  }

  if (used >= limit) {
    return {
      ...base,
      canBook: false,
      reason: `Complimentary trip limit reached (${limit} per year).`,
    }
  }

  if (activeTrips > 0) {
    return {
      ...base,
      canBook: false,
      reason: 'Complete your current trip before booking another.',
    }
  }

  if (completedTrips === 0) {
    return {
      ...base,
      canBook: true,
      reason: 'Book your first complimentary trip.',
    }
  }

  if (!nextEligibleUntil) {
    return {
      ...base,
      canBook: false,
      reason: 'Waiting for your previous trip to be marked complete.',
    }
  }

  const until = new Date(nextEligibleUntil)
  const daysLeft = daysUntil(until)

  if (daysLeft < 0) {
    return {
      ...base,
      canBook: false,
      daysUntilLock: daysLeft,
      reason: 'Your 6-month booking window has expired. Contact admin to extend.',
    }
  }

  let warning: string | null = null
  if (daysLeft <= WARNING_DAYS) {
    warning = `Book your next trip within ${daysLeft} day${daysLeft === 1 ? '' : 's'} — window closes ${until.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`
  }

  return {
    ...base,
    canBook: true,
    daysUntilLock: daysLeft,
    warning,
    reason: `Next trip available until ${until.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
  }
}

export async function getTripBookingEligibility(
  service: SupabaseClient,
  influencer: InfluencerRow
): Promise<TripBookingEligibility> {
  await autoCompletePastTrips(service, influencer.id)

  const { data: freshInfluencer } = await service
    .from('influencers')
    .select('portal_unlocked, free_trips_used_this_year, last_trip_completed_at, next_trip_eligible_until')
    .eq('id', influencer.id)
    .maybeSingle()

  const { data: slots } = await service
    .from('partner_trip_slots')
    .select('id, status, return_date, departure_date, completed_at')
    .eq('influencer_id', influencer.id)

  return computeTripBookingEligibility(
    { ...influencer, ...freshInfluencer },
    slots ?? []
  )
}

export async function extendTripEligibility(
  service: SupabaseClient,
  influencerId: string,
  untilIso: string
): Promise<void> {
  await service
    .from('influencers')
    .update({ next_trip_eligible_until: untilIso })
    .eq('id', influencerId)
}

/** Next allowed Friday dates for custom picker (next 26 weeks). */
export function upcomingFridays(count = 26): string[] {
  const out: string[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (d.getDay() !== 5) {
    d.setDate(d.getDate() + 1)
  }
  if (d <= new Date()) {
    d.setDate(d.getDate() + 7)
  }
  for (let i = 0; i < count; i++) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    out.push(`${y}-${m}-${day}`)
    d.setDate(d.getDate() + 7)
  }
  return out
}

export function dateOnlyToIso(dateStr: string): string {
  return parseDateOnly(dateStr).toISOString()
}
