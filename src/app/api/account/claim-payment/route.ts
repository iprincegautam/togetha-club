import { NextRequest, NextResponse } from 'next/server'
import { requireMemberApiAccess } from '@/lib/auth/member'
import { claimRazorpayPaymentForApplicant } from '@/lib/payment-claim'

export async function POST(req: NextRequest) {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json().catch(() => ({}))
  const razorpayPaymentId = String(body.razorpayPaymentId ?? body.paymentId ?? '').trim()
  const couponCode = body.couponCode ? String(body.couponCode).trim() : null

  if (!razorpayPaymentId) {
    return NextResponse.json({ error: 'Razorpay payment ID is required' }, { status: 400 })
  }

  const result = await claimRazorpayPaymentForApplicant(auth.service, {
    applicantId: auth.applicant.id,
    razorpayPaymentId,
    couponCode,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    status: result.status,
    paymentPlan: result.paymentPlan,
    amountPaid: result.amountPaid,
    balanceDue: result.balanceDue,
    discountAmount: result.discountAmount,
    finalAmount: result.finalAmount,
    couponCode: result.couponCode,
  })
}
