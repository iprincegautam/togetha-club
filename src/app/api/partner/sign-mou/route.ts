import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'
import { MOU_VERSION } from '@/lib/mou-text'
import { notifyAdmin } from '@/lib/notifications'

export async function POST(request: Request) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const fullNameConfirmed = String(body.fullNameConfirmed ?? '').trim()
  if (!fullNameConfirmed) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
  }

  if (auth.influencer.mou_signed) {
    return NextResponse.json({ success: true, alreadySigned: true })
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null

  const { error: sigError } = await auth.service.from('mou_signatures').insert({
    influencer_id: auth.influencer.id,
    ip_address: ip,
    full_name_confirmed: fullNameConfirmed,
    version: MOU_VERSION,
  })

  if (sigError) {
    return NextResponse.json({ error: sigError.message }, { status: 500 })
  }

  const { error: updError } = await auth.service
    .from('influencers')
    .update({
      mou_signed: true,
      mou_signed_at: new Date().toISOString(),
      status: auth.influencer.status === 'applied' ? 'signed' : auth.influencer.status,
    })
    .eq('id', auth.influencer.id)

  if (updError) {
    return NextResponse.json({ error: updError.message }, { status: 500 })
  }

  await notifyAdmin(auth.service, {
    type: 'mou_signed',
    title: `${auth.influencer.name} signed the MOU`,
    body: `${fullNameConfirmed} signed the partner agreement (${MOU_VERSION}).`,
    metadata: { influencerId: auth.influencer.id },
  })

  return NextResponse.json({ success: true })
}
