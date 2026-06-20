import { NextResponse } from 'next/server'
import { isDevelopment } from '@/lib/is-dev'
import { requireMemberApiAccess } from '@/lib/auth/member'
import { getOrCreateRazorpayCustomer } from '@/lib/razorpay-customer'
import {
  buildOrderReceipt,
  formatRazorpayApiError,
  getRazorpayCheckoutKeyId,
  isRazorpayConfigured,
  razorpay,
  validateRazorpayKeyConfiguration,
} from '@/lib/razorpay'

export async function POST() {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const applicant = auth.applicant
  const balanceDue = applicant.balance_due ?? 0

  if (balanceDue <= 0) {
    return NextResponse.json({ error: 'No balance due on this booking' }, { status: 400 })
  }

  if (applicant.status !== 'deposit_paid') {
    return NextResponse.json(
      { error: 'Balance payment is only available after a deposit booking' },
      { status: 400 }
    )
  }

  if (!isRazorpayConfigured()) {
    if (isDevelopment()) {
      return NextResponse.json({
        orderId: `dev_balance_${applicant.id}`,
        amount: balanceDue,
        currency: 'INR',
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dev_key',
        dev: true,
      })
    }
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }

  const { customerId } = await getOrCreateRazorpayCustomer(auth.service, {
    userId: auth.session.user.id,
    email: auth.profile!.email,
    name: auth.profile!.full_name || auth.profile!.email,
    phone: auth.profile!.phone,
  })

  const keyCheck = validateRazorpayKeyConfiguration()
  if (!keyCheck.ok) {
    console.error('[POST /api/account/balance-order]', keyCheck.message)
    return NextResponse.json({ error: keyCheck.message }, { status: 503 })
  }

  let order
  try {
    order = await razorpay.orders.create({
      amount: balanceDue,
      currency: 'INR',
      receipt: buildOrderReceipt(`${applicant.id}-bal`),
      notes: {
        payment_plan: 'balance',
        applicant_id: applicant.id,
        ...(customerId ? { customer_id: customerId } : {}),
      },
    })
  } catch (razorpayErr) {
    console.error('[POST /api/account/balance-order] Razorpay order.create failed:', razorpayErr)
    return NextResponse.json({ error: formatRazorpayApiError(razorpayErr) }, { status: 502 })
  }

  await auth.service
    .from('applicants')
    .update({ razorpay_order_id: order.id })
    .eq('id', applicant.id)

  return NextResponse.json({
    orderId: order.id,
    amount: balanceDue,
    currency: 'INR',
    keyId: getRazorpayCheckoutKeyId(),
    customerId: customerId ?? undefined,
  })
}
