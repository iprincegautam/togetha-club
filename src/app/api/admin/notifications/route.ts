import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { insertNotification, notifyInfluencer } from '@/lib/notifications'

export async function GET(request: Request) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const countOnly = new URL(request.url).searchParams.get('count') === 'true'

  if (countOnly) {
    const { count } = await auth.service
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_admin', true)
      .eq('read', false)
    return NextResponse.json({ unread: count ?? 0 })
  }

  const { data, error } = await auth.service
    .from('notifications')
    .select('id, type, title, body, read, created_at, influencer_id, influencers(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notifications: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const title = String(body.title ?? '').trim().slice(0, 80)
  const msg = String(body.body ?? '').trim().slice(0, 300)
  const type = String(body.type ?? 'announcement')
  const mode = body.recipientMode as string

  if (!title || !msg) {
    return NextResponse.json({ error: 'Title and body required' }, { status: 400 })
  }

  if (mode === 'specific' && body.influencerId) {
    await notifyInfluencer(auth.service, {
      influencerId: String(body.influencerId),
      type,
      title,
      body: msg,
    })
  } else if (mode === 'pending_content') {
    const { data } = await auth.service
      .from('content_items')
      .select('influencer_id')
      .in('status', ['pending', 'overdue'])
    const ids = [...new Set((data ?? []).map((r) => r.influencer_id))]
    for (const id of ids) {
      await notifyInfluencer(auth.service, { influencerId: id, type, title, body: msg })
    }
  } else {
    const { data } = await auth.service.from('influencers').select('id').eq('status', 'active')
    for (const inf of data ?? []) {
      await notifyInfluencer(auth.service, {
        influencerId: inf.id,
        type,
        title,
        body: msg,
      })
    }
  }

  await insertNotification(auth.service, {
    isAdmin: true,
    type: 'admin_sent',
    title: `Sent: ${title}`,
    body: msg,
  })

  return NextResponse.json({ success: true })
}
