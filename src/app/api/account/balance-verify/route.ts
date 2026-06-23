import { NextRequest, NextResponse } from 'next/server'
import { isDevelopment } from '@/lib/is-dev'
import { requireMemberApiAccess } from '@/lib/auth/member'
import { recordPromoRedemption } from '@/lib/promo'
import { isRazorpayConfigured, verifyRazorpaySignature } from '@/lib/razorpay'
import { canMemberPayBalance } from '@/lib/applicant-kyc'
import { recordApplicantPayment } from '@/lib/applicant-payments'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireMemberApiAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await req.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    const applicant = auth.applicant
    const balanceDue = applicant.balance_due ?? 0

    if (!canMemberPayBalance(applicant)) {
      return NextResponse.json(
        {
          error:
            applicant.kyc_status !== 'approved'
              ? 'Balance payment opens after our team approves your profile.'
              : 'Balance payment is not available for this booking.',
        },
        { status: 403 }
      )
    }

    if (balanceDue <= 0) {
      return NextResponse.json({ error: 'No balance due' }, { status: 400 })
    }

    const isDevOrder =
      isDevelopment() && String(razorpayOrderId).startsWith('dev_balance_')

    if (!isDevOrder) {
      if (!isRazorpayConfigured()) {
        return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
      }
      const valid = verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      )
      if (!valid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const amountPaid = (applicant.amount_paid ?? 0) + balanceDue

    const { error: updateError } = await auth.service
      .from('applicants')
      .update({
        status: 'paid',
        payment_plan: 'full',
        amount_paid: amountPaid,
        balance_due: 0,
        razorpay_payment_id: razorpayPaymentId,
      })
      .eq('id', applicant.id)

    if (updateError) throw updateError

    await recordApplicantPayment(auth.service, {
      applicantId: applicant.id,
      razorpayPaymentId,
      razorpayOrderId,
      paymentKind: 'balance',
      amountPaise: balanceDue,
    })

    await recordPromoRedemption(auth.service, applicant.id)

    return NextResponse.json({ success: true, status: 'paid' })
  } catch (err) {
    console.error('[POST /api/account/balance-verify]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
