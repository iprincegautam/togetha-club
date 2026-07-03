import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type RouteParams = { params: Promise<{ slug: string; id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { slug, id } = await params

  const { data: departure } = await auth.service
    .from('batch_departures')
    .select('id')
    .eq('id', id)
    .eq('batch_slug', slug)
    .maybeSingle()
  if (!departure) {
    return NextResponse.json({ error: 'Departure not found' }, { status: 404 })
  }

  const { data, error } = await auth.service
    .from('departure_logistics')
    .select('*')
    .eq('departure_id', id)
    .maybeSingle()

  if (error) {
    console.error('[GET departure logistics]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ logistics: data })
}

export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { slug, id } = await params
  const body = await request.json()

  const { data: departure } = await auth.service
    .from('batch_departures')
    .select('id')
    .eq('id', id)
    .eq('batch_slug', slug)
    .maybeSingle()
  if (!departure) {
    return NextResponse.json({ error: 'Departure not found' }, { status: 404 })
  }

  const { data, error } = await auth.service
    .from('departure_logistics')
    .upsert(
      {
        departure_id: id,
        pickup_location: body.pickupLocation ? String(body.pickupLocation).trim() : null,
        vehicle_number: body.vehicleNumber ? String(body.vehicleNumber).trim() : null,
        reporting_time: body.reportingTime ? String(body.reportingTime).trim() : null,
        departure_time: body.departureTime ? String(body.departureTime).trim() : null,
        arrival_time: body.arrivalTime ? String(body.arrivalTime).trim() : null,
        guide_name: body.guideName ? String(body.guideName).trim() : null,
        guide_phone: body.guidePhone ? String(body.guidePhone).trim() : null,
        guide_email: body.guideEmail ? String(body.guideEmail).trim() : null,
      },
      { onConflict: 'departure_id' }
    )
    .select('*')
    .single()

  if (error) {
    console.error('[PUT departure logistics]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ logistics: data })
}
