import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type RouteParams = { params: Promise<{ slug: string; id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { slug, id } = await params
  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.label !== undefined) updates.label = String(body.label).trim()
  if (body.sublabel !== undefined) updates.sublabel = body.sublabel ? String(body.sublabel).trim() : null
  if (body.departureDate !== undefined) updates.departure_date = body.departureDate || null
  if (body.returnDate !== undefined) updates.return_date = body.returnDate || null
  if (body.status !== undefined) updates.status = body.status
  if (body.spotsM !== undefined) updates.spots_m = Number(body.spotsM)
  if (body.spotsF !== undefined) updates.spots_f = Number(body.spotsF)
  if (body.spotsTakenM !== undefined) updates.spots_taken_m = Number(body.spotsTakenM)
  if (body.spotsTakenF !== undefined) updates.spots_taken_f = Number(body.spotsTakenF)
  if (body.sortOrder !== undefined) updates.sort_order = Number(body.sortOrder)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('batch_departures')
    .update(updates)
    .eq('id', id)
    .eq('batch_slug', slug)
    .select('*')
    .single()

  if (error) {
    console.error('[PATCH departure]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ departure: data })
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { slug, id } = await params
  const { error } = await auth.service
    .from('batch_departures')
    .delete()
    .eq('id', id)
    .eq('batch_slug', slug)

  if (error) {
    console.error('[DELETE departure]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
