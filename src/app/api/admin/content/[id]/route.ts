import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { notifyInfluencer } from '@/lib/notifications'
import { unlockPartnerPortal } from '@/lib/partner-portal-unlock'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json()
  const action = body.action as string

  const { data: item } = await auth.service
    .from('content_items')
    .select('*, batches(name)')
    .eq('id', id)
    .maybeSingle()

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const batch = Array.isArray(item.batches) ? item.batches[0] : item.batches
  const reviewer = auth.session?.user?.email ?? 'admin'

  if (action === 'approve') {
    await auth.service
      .from('content_items')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: reviewer })
      .eq('id', id)

    if (item.type === 'pre_trip') {
      await unlockPartnerPortal(auth.service, item.influencer_id)
    } else {
      await notifyInfluencer(auth.service, {
        influencerId: item.influencer_id,
        type: 'content_approved',
        title: 'Content approved',
        body: `Your ${item.type} for ${batch?.name ?? item.batch_slug} has been approved.`,
      })
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'reject') {
    const feedback = String(body.feedback ?? '').trim()
    await auth.service
      .from('content_items')
      .update({
        status: 'rejected',
        feedback,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
      })
      .eq('id', id)

    await notifyInfluencer(auth.service, {
      influencerId: item.influencer_id,
      type: 'content_rejected',
      title: 'Content needs changes',
      body: feedback || `Please revise your ${item.type} for ${batch?.name ?? item.batch_slug}.`,
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
