import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.active !== undefined) updates.active = Boolean(body.active)
  if (body.maxUses !== undefined) updates.max_uses = body.maxUses ? Number(body.maxUses) : null
  if (body.commissionAmount !== undefined) updates.commission_amount = Number(body.commissionAmount)
  if (body.discountValue !== undefined) updates.discount_value = Number(body.discountValue)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('promo_codes')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ promoCode: data })
}
