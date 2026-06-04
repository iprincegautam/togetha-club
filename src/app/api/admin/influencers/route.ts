import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { generatePromoCode, provisionInfluencerAccount } from '@/lib/influencer-account'

export async function GET() {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await auth.service
    .from('influencers')
    .select('id, name, email, phone, status, payout_upi, created_at')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ influencers: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { data: influencer, error } = await auth.service
    .from('influencers')
    .insert({
      name: String(body.name).trim(),
      email: body.email ? String(body.email).trim().toLowerCase() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      status: body.status ?? 'active',
      notes: body.notes ? String(body.notes).trim() : null,
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let login: { temporaryPassword?: string; isNewUser: boolean } | null = null
  if (body.createLogin && influencer.email) {
    login = await provisionInfluencerAccount(auth.service, {
      influencerId: influencer.id,
      email: influencer.email,
      name: influencer.name,
    })
  }

  return NextResponse.json({ influencer, login })
}
