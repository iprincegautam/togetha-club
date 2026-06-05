import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'
import { attachTripDatesToContentProgram } from '@/lib/content-calendar'
import { notifyAdmin } from '@/lib/notifications'
import { formatDateOnly, validateCustomFridayStart } from '@/lib/partner-trip-dates'
import {
  getTripBookingEligibility,
  upcomingFridays,
} from '@/lib/partner-trip-eligibility'

export async function GET() {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const eligibility = await getTripBookingEligibility(auth.service, auth.influencer)

  const { data: slots } = await auth.service
    .from('partner_trip_slots')
    .select(
      `
      *,
      batches ( name ),
      batch_departures ( label, departure_date, return_date )
    `
    )
    .eq('influencer_id', auth.influencer.id)
    .order('created_at', { ascending: false })

  const { data: batches } = await auth.service
    .from('batches')
    .select('slug, name, status')
    .eq('status', 'open')

  const batchSlugs = (batches ?? []).map((b) => b.slug)
  const { data: departures } = await auth.service
    .from('batch_departures')
    .select('*')
    .in('batch_slug', batchSlugs.length ? batchSlugs : ['batch-a'])
    .eq('status', 'open')
    .order('sort_order')

  return NextResponse.json({
    portalUnlocked: Boolean(auth.influencer.portal_unlocked),
    eligibility,
    upcomingFridays: upcomingFridays(),
    entitlement: {
      used: eligibility.used,
      limit: eligibility.limit,
      resetYear: auth.influencer.free_trips_reset_year ?? 2026,
    },
    slots: (slots ?? []).map((s) => {
      const batch = Array.isArray(s.batches) ? s.batches[0] : s.batches
      const dep = Array.isArray(s.batch_departures) ? s.batch_departures[0] : s.batch_departures
      const depDate = s.departure_date ?? dep?.departure_date ?? null
      const retDate = s.return_date ?? dep?.return_date ?? null
      let departureLabel = dep?.label ?? null
      if (s.booking_mode === 'custom' && depDate && retDate) {
        departureLabel = `${depDate} → ${retDate}`
      }
      return {
        id: s.id,
        batchSlug: s.batch_slug,
        batchName: batch?.name ?? s.batch_slug,
        bookingMode: s.booking_mode ?? 'preset',
        type: s.type,
        status: s.status,
        guestName: s.guest_name,
        guestPhone: s.guest_phone,
        guestAddedAt: s.guest_added_at,
        departureLabel,
        departureDate: depDate,
        returnDate: retDate,
        completedAt: s.completed_at,
      }
    }),
    availableBatches: batches ?? [],
    departures: departures ?? [],
  })
}

export async function POST(request: Request) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()

  if (body.guestName !== undefined) {
    const slotId = String(body.slotId ?? '')
    if (!slotId) {
      return NextResponse.json({ error: 'slotId required' }, { status: 400 })
    }
    const guestName = String(body.guestName).trim()
    const guestPhone = String(body.guestPhone ?? '').trim()
    if (!guestName || !body.guestConsent) {
      return NextResponse.json({ error: 'Guest details and consent required' }, { status: 400 })
    }

    const { error } = await auth.service
      .from('partner_trip_slots')
      .update({
        guest_name: guestName,
        guest_phone: guestPhone || null,
        guest_added_at: new Date().toISOString(),
      })
      .eq('id', slotId)
      .eq('influencer_id', auth.influencer.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await notifyAdmin(auth.service, {
      type: 'plus_one',
      title: `${auth.influencer.name} registered a plus-one`,
      body: `${guestName} added as guest.`,
      metadata: { slotId },
    })

    return NextResponse.json({ success: true })
  }

  const eligibility = await getTripBookingEligibility(auth.service, auth.influencer)
  if (!eligibility.canBook) {
    return NextResponse.json({ error: eligibility.reason }, { status: 403 })
  }

  const batchSlug = String(body.batchSlug ?? '')
  if (!batchSlug) {
    return NextResponse.json({ error: 'batchSlug required' }, { status: 400 })
  }

  const bookingMode = body.bookingMode === 'custom' ? 'custom' : 'preset'
  const used = auth.influencer.free_trips_used_this_year ?? 0

  let departureId: string | null = null
  let departureDate: string
  let returnDate: string
  let departureLabel: string
  let batchName: string

  if (bookingMode === 'custom') {
    const fridayStart = String(body.fridayStart ?? '')
    if (!fridayStart) {
      return NextResponse.json({ error: 'Pick a Friday start date' }, { status: 400 })
    }
    let parsed
    try {
      parsed = validateCustomFridayStart(fridayStart)
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Invalid date' },
        { status: 400 }
      )
    }
    departureDate = formatDateOnly(parsed.start)
    returnDate = formatDateOnly(parsed.end)
    departureLabel = parsed.label

    const { data: batchRow } = await auth.service
      .from('batches')
      .select('name')
      .eq('slug', batchSlug)
      .maybeSingle()
    batchName = batchRow?.name ?? batchSlug
  } else {
    const departureIdRaw = String(body.departureId ?? '')
    if (!departureIdRaw) {
      return NextResponse.json({ error: 'departureId required for scheduled batch' }, { status: 400 })
    }

    const { data: departure } = await auth.service
      .from('batch_departures')
      .select('*, batches(name)')
      .eq('id', departureIdRaw)
      .maybeSingle()

    if (!departure) {
      return NextResponse.json({ error: 'Departure not found' }, { status: 404 })
    }

    departureId = departureIdRaw
    departureDate = departure.departure_date
      ? formatDateOnly(new Date(departure.departure_date))
      : formatDateOnly(new Date())
    returnDate = departure.return_date
      ? formatDateOnly(new Date(departure.return_date))
      : departureDate
    departureLabel = departure.label
    const batch = Array.isArray(departure.batches) ? departure.batches[0] : departure.batches
    batchName = batch?.name ?? batchSlug
  }

  const { data: slot, error: slotError } = await auth.service
    .from('partner_trip_slots')
    .insert({
      influencer_id: auth.influencer.id,
      batch_slug: batchSlug,
      departure_id: departureId,
      departure_date: departureDate,
      return_date: returnDate,
      booking_mode: bookingMode,
      type: 'complimentary',
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (slotError) {
    return NextResponse.json({ error: slotError.message }, { status: 500 })
  }

  await auth.service
    .from('influencers')
    .update({ free_trips_used_this_year: used + 1 })
    .eq('id', auth.influencer.id)

  await attachTripDatesToContentProgram(auth.service, {
    influencerId: auth.influencer.id,
    batchSlug,
    batchName,
    departureId,
    departure: {
      departure_date: departureDate,
      return_date: returnDate,
      label: departureLabel,
    },
  })

  await notifyAdmin(auth.service, {
    type: 'trip_booked',
    title: `${auth.influencer.name} booked a complimentary trip`,
    body: `${batchName} — ${departureLabel}`,
    metadata: { slotId: slot.id, bookingMode },
  })

  return NextResponse.json({ success: true, slotId: slot.id })
}
