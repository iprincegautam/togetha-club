import { NextResponse } from 'next/server'
import { requireMemberApiAccess } from '@/lib/auth/member'
import { deleteSavedCard } from '@/lib/razorpay-customer'

type RouteParams = { params: Promise<{ tokenId: string }> }

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { tokenId } = await params

  const { data: profile } = await auth.service
    .from('profiles')
    .select('razorpay_customer_id')
    .eq('id', auth.session.user.id)
    .single()

  const customerId = profile?.razorpay_customer_id

  if (!customerId) {
    return NextResponse.json({ error: 'No saved cards on file' }, { status: 400 })
  }

  const result = await deleteSavedCard(customerId, tokenId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
