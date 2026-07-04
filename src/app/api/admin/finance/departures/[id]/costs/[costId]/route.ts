import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type RouteParams = { params: Promise<{ id: string; costId: string }> }

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { id, costId } = await params

  const { data, error } = await auth.service
    .from('departure_costs')
    .delete()
    .eq('id', costId)
    .eq('departure_id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[DELETE departure cost]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Cost not found' }, { status: 404 })
  }

  return NextResponse.json({ deleted: data.id })
}
