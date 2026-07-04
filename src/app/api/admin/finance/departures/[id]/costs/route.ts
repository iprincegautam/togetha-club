import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type RouteParams = { params: Promise<{ id: string }> }

const COST_TYPES = ['hotel', 'vehicle', 'other'] as const

async function findDeparture(service: SupabaseClient, id: string) {
  const { data } = await service
    .from('batch_departures')
    .select('id, batch_slug, label')
    .eq('id', id)
    .maybeSingle()
  return data
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { id } = await params

  const departure = await findDeparture(auth.service, id)
  if (!departure) {
    return NextResponse.json({ error: 'Departure not found' }, { status: 404 })
  }

  const { data, error } = await auth.service
    .from('departure_costs')
    .select('*')
    .eq('departure_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[GET departure costs]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ departure, costs: data ?? [] })
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { id } = await params
  const body = await request.json()

  const departure = await findDeparture(auth.service, id)
  if (!departure) {
    return NextResponse.json({ error: 'Departure not found' }, { status: 404 })
  }

  const costType = String(body.costType ?? '')
  if (!COST_TYPES.includes(costType as (typeof COST_TYPES)[number])) {
    return NextResponse.json({ error: 'Invalid cost type' }, { status: 400 })
  }

  const amountPaise = Number(body.amountPaise)
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive amount in paise' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('departure_costs')
    .insert({
      departure_id: id,
      cost_type: costType,
      description: body.description ? String(body.description).trim() : null,
      vendor_name: body.vendorName ? String(body.vendorName).trim() : null,
      amount_paise: amountPaise,
      incurred_on: body.incurredOn ? String(body.incurredOn) : null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[POST departure cost]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cost: data })
}
