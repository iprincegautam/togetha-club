import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

export async function GET(request: Request) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const status = new URL(request.url).searchParams.get('status') ?? 'submitted'

  let query = auth.service
    .from('content_items')
    .select(
      `
      *,
      influencers ( name, instagram_handle ),
      batches ( name ),
      batch_departures ( label )
    `
    )
    .order('submitted_at', { ascending: true, nullsFirst: false })

  if (status === 'overdue') {
    query = query.eq('status', 'pending').lt('due_date', new Date().toISOString())
  } else if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const stats = await auth.service.from('content_items').select('status')
  const rows = stats.data ?? []
  const overview = {
    total: rows.length,
    submitted: rows.filter((r) => r.status === 'submitted').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    overdue: rows.filter((r) => r.status === 'pending').length,
  }

  return NextResponse.json({ items: data ?? [], overview })
}
