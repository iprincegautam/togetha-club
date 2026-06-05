import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(_request: Request, { params }: RouteParams) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const { error } = await auth.service
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('influencer_id', auth.influencer.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
