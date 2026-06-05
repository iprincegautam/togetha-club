import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'
import { buildPartnerMePayload } from '@/lib/partner-me'

export async function GET(request: Request) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view')

  const payload = await buildPartnerMePayload(auth.service, auth.influencer, view)
  return NextResponse.json(payload)
}

export async function PATCH(request: Request) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) updates.name = String(body.name).trim()
  if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null
  if (body.bio !== undefined) updates.bio = body.bio ? String(body.bio).trim() : null
  if (body.instagramHandle !== undefined) {
    updates.instagram_handle = body.instagramHandle ? String(body.instagramHandle).trim() : null
  }
  if (body.payoutUpi !== undefined) {
    updates.payout_upi = body.payoutUpi ? String(body.payoutUpi).trim() : null
  }
  if (body.payoutBankName !== undefined) {
    updates.payout_bank_name = body.payoutBankName ? String(body.payoutBankName).trim() : null
  }
  if (body.payoutAccountHolder !== undefined) {
    updates.payout_account_holder = body.payoutAccountHolder
      ? String(body.payoutAccountHolder).trim()
      : null
  }
  if (body.payoutAccountNumber !== undefined) {
    updates.payout_account_number = body.payoutAccountNumber
      ? String(body.payoutAccountNumber).trim()
      : null
  }
  if (body.payoutIfsc !== undefined) {
    updates.payout_ifsc = body.payoutIfsc ? String(body.payoutIfsc).trim().toUpperCase() : null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('influencers')
    .update(updates)
    .eq('id', auth.influencer.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    influencer: {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      bio: data.bio,
      instagramHandle: data.instagram_handle,
      payoutUpi: data.payout_upi,
      payoutBankName: data.payout_bank_name,
      payoutAccountHolder: data.payout_account_holder,
      payoutAccountNumber: data.payout_account_number,
      payoutIfsc: data.payout_ifsc,
    },
  })
}
