import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { fetchBatchesForAdmin, mapBatchRow } from '@/lib/batches'

export async function GET() {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const batches = await fetchBatchesForAdmin(auth.service)
  return NextResponse.json({ batches: batches.map(mapBatchRow) })
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const slug = body.slug as string | undefined
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = String(body.name)
  if (body.price !== undefined) updates.price = body.price === null ? null : Number(body.price)
  if (body.status !== undefined) updates.status = body.status
  if (body.spotsTakenM !== undefined) updates.spots_taken_m = Number(body.spotsTakenM)
  if (body.spotsTakenF !== undefined) updates.spots_taken_f = Number(body.spotsTakenF)
  if (body.maxSpotsM !== undefined) updates.max_spots_m = Number(body.maxSpotsM)
  if (body.maxSpotsF !== undefined) updates.max_spots_f = Number(body.maxSpotsF)
  if (body.depositPercent !== undefined) updates.deposit_percent = Number(body.depositPercent)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('batches')
    .update(updates)
    .eq('slug', slug)
    .select(
      'slug, name, price, status, spots_taken_m, spots_taken_f, max_spots_m, max_spots_f, deposit_percent'
    )
    .single()

  if (error) {
    console.error('[PATCH /api/admin/batches]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ batch: mapBatchRow(data) })
}
