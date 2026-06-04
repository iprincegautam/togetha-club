import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { generatePromoCode } from '@/lib/influencer-account'

export async function POST(request: Request) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  if (!body.influencerId) {
    return NextResponse.json({ error: 'influencerId is required' }, { status: 400 })
  }

  const code = (body.code ? String(body.code).trim().toUpperCase() : generatePromoCode()).replace(
    /\s+/g,
    ''
  )

  const { data, error } = await auth.service
    .from('promo_codes')
    .insert({
      code,
      influencer_id: body.influencerId,
      discount_type: body.discountType === 'percent' ? 'percent' : 'fixed_inr',
      discount_value: Number(body.discountValue) || 2000,
      commission_amount: Number(body.commissionAmount) || 0,
      grants_priority: Boolean(body.grantsPriority),
      max_uses: body.maxUses ? Number(body.maxUses) : null,
      active: body.active !== false,
      batch_slugs: body.batchSlugs?.length ? body.batchSlugs : ['batch-a', 'batch-b'],
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ promoCode: data })
}
