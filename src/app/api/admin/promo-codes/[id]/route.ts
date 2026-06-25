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
  if (body.grantsPriority !== undefined) updates.grants_priority = Boolean(body.grantsPriority)

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

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  const { data: promo, error: fetchError } = await auth.service
    .from('promo_codes')
    .select('id, uses_count')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!promo) {
    return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
  }

  if (promo.uses_count > 0) {
    return NextResponse.json(
      { error: 'This code has been used — deactivate it instead of deleting.' },
      { status: 409 }
    )
  }

  const { count, error: redemptionError } = await auth.service
    .from('promo_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('promo_code_id', id)

  if (redemptionError) {
    return NextResponse.json({ error: redemptionError.message }, { status: 500 })
  }

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'This code has been used — deactivate it instead of deleting.' },
      { status: 409 }
    )
  }

  const { error: deleteError } = await auth.service.from('promo_codes').delete().eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
