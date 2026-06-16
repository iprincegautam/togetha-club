import { NextRequest, NextResponse } from 'next/server'
import { isDevelopment } from '@/lib/is-dev'
import { provisionMemberAccount } from '@/lib/member-account'
import { calculatePaymentAmounts, statusForPaymentPlan, type PaymentPlan } from '@/lib/payment-plan'
import { recordPromoRedemption } from '@/lib/promo'
import { isRazorpayConfigured, razorpay, verifyRazorpaySignature } from '@/lib/razorpay'
import { sendConfirmationEmail } from '@/lib/resend'
import { stopNurtureSequence } from '@/lib/nurture/should-stop'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, applicantId } = body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !applicantId) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    const supabase = tryCreateServiceRoleClient()
    if (!supabase) {
      if (isDevelopment()) {
        return NextResponse.json({ success: true, dev: true })
      }
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const isDevOrder =
      isDevelopment() && razorpayOrderId.startsWith('dev_order_')

    if (isDevOrder) {
      // Dev-only bypass — no signature check
    } else if (isRazorpayConfigured()) {
      const valid = verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      )
      if (!valid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
    }

    let paymentPlan: PaymentPlan = 'full'
    let chargeAmountPaise = 0

    if (!isDevOrder && isRazorpayConfigured()) {
      try {
        const order = await razorpay.orders.fetch(razorpayOrderId)
        chargeAmountPaise = Number(order.amount)
        if (order.notes?.payment_plan === 'deposit') {
          paymentPlan = 'deposit'
        }
      } catch (fetchErr) {
        console.error('[POST /api/payment/verify] order fetch', fetchErr)
      }
    }

    const { data: applicantPlanRow } = await supabase
      .from('applicants')
      .select('payment_plan, final_amount')
      .eq('id', applicantId)
      .maybeSingle()

    if (applicantPlanRow?.payment_plan === 'deposit') {
      paymentPlan = 'deposit'
    } else if (applicantPlanRow?.payment_plan === 'full') {
      paymentPlan = 'full'
    }

    const totalDuePaise = applicantPlanRow?.final_amount ?? chargeAmountPaise
    if (isDevOrder && chargeAmountPaise <= 0 && totalDuePaise > 0) {
      chargeAmountPaise = calculatePaymentAmounts(totalDuePaise, paymentPlan).chargeNow
    }

    const newAmountPaid = chargeAmountPaise
    const newBalanceDue =
      paymentPlan === 'full' ? 0 : Math.max(0, totalDuePaise - newAmountPaid)

    const newStatus = statusForPaymentPlan(paymentPlan)

    let { error: updateError } = await supabase
      .from('applicants')
      .update({
        status: newStatus,
        razorpay_payment_id: razorpayPaymentId,
        amount_paid: newAmountPaid,
        balance_due: newBalanceDue,
      })
      .eq('id', applicantId)

    if (updateError?.code === '23514') {
      ;({ error: updateError } = await supabase
        .from('applicants')
        .update({
          status: 'paid',
          razorpay_payment_id: razorpayPaymentId,
        })
        .eq('id', applicantId))
    }

    if (updateError) throw updateError

    if (paymentPlan === 'full') {
      await recordPromoRedemption(supabase, applicantId)
    }

    const { data: applicant, error: fetchError } = await supabase
      .from('applicants')
      .select('name, email, phone, gender, batch_slug')
      .eq('id', applicantId)
      .single()

    if (fetchError || !applicant) throw fetchError ?? new Error('Applicant not found')

    await provisionMemberAccount(supabase, {
      applicantId,
      email: applicant.email,
      name: applicant.name,
      phone: applicant.phone,
    })

    if (applicant.batch_slug && applicant.gender) {
      const spotField = applicant.gender === 'm' ? 'spots_taken_m' : 'spots_taken_f'
      const { data: batchRow } = await supabase
        .from('batches')
        .select(spotField)
        .eq('slug', applicant.batch_slug)
        .single()

      if (batchRow) {
        const current = (batchRow as Record<string, number>)[spotField] ?? 0
        await supabase
          .from('batches')
          .update({ [spotField]: current + 1 })
          .eq('slug', applicant.batch_slug)
      }
    }

    if (applicant.batch_slug && applicant.email) {
      const { data: batch } = await supabase
        .from('batches')
        .select('name')
        .eq('slug', applicant.batch_slug)
        .single()

      if (batch?.name) {
        await sendConfirmationEmail(
          applicant.email,
          applicant.name || 'there',
          batch.name
        )
      }
    }

    try {
      await stopNurtureSequence(supabase, applicantId, 'paid')
    } catch (nurtureErr) {
      console.warn('[POST /api/payment/verify] nurture stop failed', nurtureErr)
    }

    return NextResponse.json({
      success: true,
      paymentPlan,
      status: newStatus,
    })
  } catch (err) {
    console.error('[POST /api/payment/verify]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
