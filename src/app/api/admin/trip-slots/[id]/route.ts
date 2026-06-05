import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { markTripSlotCompleted } from '@/lib/partner-trip-eligibility'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json()
  const action = String(body.action ?? '')

  const { data: slot } = await auth.service
    .from('partner_trip_slots')
    .select('id, influencer_id, status')
    .eq('id', id)
    .maybeSingle()

  if (!slot) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  if (action === 'complete') {
    if (slot.status === 'completed') {
      return NextResponse.json({ success: true, alreadyCompleted: true })
    }
    await markTripSlotCompleted(auth.service, slot.influencer_id, slot.id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
