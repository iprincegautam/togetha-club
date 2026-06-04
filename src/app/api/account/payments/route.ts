import { NextResponse } from 'next/server'
import { requireMemberApiAccess } from '@/lib/auth/member'
import {
  getOrCreateRazorpayCustomer,
  listSavedCards,
} from '@/lib/razorpay-customer'
import { isRazorpayConfigured } from '@/lib/razorpay'

export async function GET() {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json({
      configured: false,
      customerId: null,
      cards: [],
    })
  }

  const { customerId } = await getOrCreateRazorpayCustomer(auth.service, {
    userId: auth.session.user.id,
    email: auth.profile!.email,
    name: auth.profile!.full_name || auth.profile!.email,
    phone: auth.profile!.phone,
  })

  const cards = customerId ? await listSavedCards(customerId) : []

  return NextResponse.json({
    configured: true,
    customerId,
    cards,
  })
}
