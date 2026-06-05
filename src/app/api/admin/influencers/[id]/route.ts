import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { provisionInfluencerAccount } from '@/lib/influencer-account'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) updates.name = String(body.name).trim()
  if (body.email !== undefined) updates.email = body.email ? String(body.email).trim().toLowerCase() : null
  if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null
  if (body.status !== undefined) updates.status = body.status
  if (body.notes !== undefined) updates.notes = body.notes ? String(body.notes).trim() : null
  if (body.payoutUpi !== undefined) updates.payout_upi = body.payoutUpi ? String(body.payoutUpi).trim() : null
  if (body.panVerified !== undefined) updates.pan_verified = Boolean(body.panVerified)
  if (body.freeTripsUsedThisYear !== undefined) {
    updates.free_trips_used_this_year = Number(body.freeTripsUsedThisYear)
  }
  if (body.tripFmvThisYear !== undefined) {
    updates.trip_fmv_this_year = Number(body.tripFmvThisYear)
  }

  if (Object.keys(updates).length === 0 && !body.createLogin) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  let influencer = null
  if (Object.keys(updates).length > 0) {
    const { data, error } = await auth.service
      .from('influencers')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    influencer = data
  } else {
    const { data } = await auth.service.from('influencers').select('*').eq('id', id).single()
    influencer = data
  }

  let login = null
  if (body.createLogin && influencer?.email) {
    login = await provisionInfluencerAccount(auth.service, {
      influencerId: id,
      email: influencer.email,
      name: influencer.name,
    })
  }

  return NextResponse.json({ influencer, login })
}
