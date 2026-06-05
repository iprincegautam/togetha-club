import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'

export async function GET(request: Request) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const countOnly = searchParams.get('count') === 'true'

  if (countOnly) {
    const { count } = await auth.service
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('influencer_id', auth.influencer.id)
      .eq('is_admin', false)
      .eq('read', false)
    return NextResponse.json({ unread: count ?? 0 })
  }

  const { data, error } = await auth.service
    .from('notifications')
    .select('id, type, title, body, read, created_at')
    .eq('influencer_id', auth.influencer.id)
    .eq('is_admin', false)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ notifications: data ?? [] })
}
