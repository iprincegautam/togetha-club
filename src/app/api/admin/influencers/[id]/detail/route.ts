import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  const { data: influencer, error } = await auth.service
    .from('influencers')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !influencer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const [promoCodes, redemptions, contentItems, tripSlots, notifications, mou] = await Promise.all([
    auth.service.from('promo_codes').select('*').eq('influencer_id', id),
    auth.service
      .from('promo_redemptions')
      .select('*, applicants(name, email, batch_slug), promo_codes(code)')
      .eq('influencer_id', id)
      .order('created_at', { ascending: false }),
    auth.service.from('content_items').select('*').eq('influencer_id', id).order('due_date'),
    auth.service
      .from('partner_trip_slots')
      .select('*, batches(name), batch_departures(label)')
      .eq('influencer_id', id),
    auth.service
      .from('notifications')
      .select('*')
      .eq('influencer_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    auth.service
      .from('mou_signatures')
      .select('*')
      .eq('influencer_id', id)
      .order('signed_at', { ascending: false })
      .limit(1),
  ])

  return NextResponse.json({
    influencer,
    promoCodes: promoCodes.data ?? [],
    redemptions: redemptions.data ?? [],
    contentItems: contentItems.data ?? [],
    tripSlots: tripSlots.data ?? [],
    notifications: notifications.data ?? [],
    mouSignature: mou.data?.[0] ?? null,
  })
}
