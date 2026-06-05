import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'
import { seedContentItemsForTrip } from '@/lib/content-calendar'
import { notifyAdmin } from '@/lib/notifications'

const FREE_TRIP_LIMIT = 2

export async function GET() {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data: slots } = await auth.service
    .from('partner_trip_slots')
    .select(
      `
      *,
      batches ( name ),
      batch_departures ( label, departure_date, return_date, status, spots_m, spots_f, spots_taken_m, spots_taken_f )
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
    entitlement: {
      used: auth.influencer.free_trips_used_this_year ?? 0,
      limit: FREE_TRIP_LIMIT,
      resetYear: auth.influencer.free_trips_reset_year ?? 2026,
    },
    slots: (slots ?? []).map((s) => {
      const batch = Array.isArray(s.batches) ? s.batches[0] : s.batches
      const dep = Array.isArray(s.batch_departures) ? s.batch_departures[0] : s.batch_departures
      return {
        id: s.id,
        batchSlug: s.batch_slug,
        batchName: batch?.name ?? s.batch_slug,
        type: s.type,
        status: s.status,
        guestName: s.guest_name,
        guestPhone: s.guest_phone,
        guestAddedAt: s.guest_added_at,
        departureLabel: dep?.label ?? null,
        departureDate: dep?.departure_date ?? null,
        returnDate: dep?.return_date ?? null,
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

  const batchSlug = String(body.batchSlug ?? '')
  const departureId = String(body.departureId ?? '')
  if (!batchSlug || !departureId) {
    return NextResponse.json({ error: 'batchSlug and departureId required' }, { status: 400 })
  }

  const used = auth.influencer.free_trips_used_this_year ?? 0
  if (used >= FREE_TRIP_LIMIT) {
    return NextResponse.json({ error: 'Complimentary trip limit reached for this year' }, { status: 400 })
  }

  const { data: departure } = await auth.service
    .from('batch_departures')
    .select('*, batches(name)')
    .eq('id', departureId)
    .maybeSingle()

  if (!departure) {
    return NextResponse.json({ error: 'Departure not found' }, { status: 404 })
  }

  const { data: slot, error: slotError } = await auth.service
    .from('partner_trip_slots')
    .insert({
      influencer_id: auth.influencer.id,
      batch_slug: batchSlug,
      departure_id: departureId,
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

  const batch = Array.isArray(departure.batches) ? departure.batches[0] : departure.batches
  await seedContentItemsForTrip(auth.service, {
    influencerId: auth.influencer.id,
    influencerName: auth.influencer.name,
    batchSlug,
    batchName: batch?.name ?? batchSlug,
    departureId,
    departure: {
      departure_date: departure.departure_date,
      return_date: departure.return_date,
      label: departure.label,
    },
  })

  await notifyAdmin(auth.service, {
    type: 'trip_booked',
    title: `${auth.influencer.name} booked a complimentary trip`,
    body: `${batch?.name ?? batchSlug} — ${departure.label}`,
    metadata: { slotId: slot.id },
  })

  return NextResponse.json({ success: true, slotId: slot.id })
}
