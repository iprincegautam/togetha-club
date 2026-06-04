import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { fetchDeparturesForBatch } from '@/lib/batches'

type RouteParams = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { slug } = await params
  const departures = await fetchDeparturesForBatch(auth.service, slug)
  return NextResponse.json({ departures })
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { slug } = await params
  const body = await request.json()

  if (!body.label?.trim()) {
    return NextResponse.json({ error: 'label is required' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('batch_departures')
    .insert({
      batch_slug: slug,
      label: String(body.label).trim(),
      sublabel: body.sublabel ? String(body.sublabel).trim() : null,
      departure_date: body.departureDate || null,
      return_date: body.returnDate || null,
      status: body.status ?? 'open',
      spots_m: body.spotsM ?? 12,
      spots_f: body.spotsF ?? 12,
      sort_order: body.sortOrder ?? 0,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[POST departures]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ departure: data })
}
