import { NextRequest, NextResponse } from 'next/server'
import { isDevelopment } from '@/lib/is-dev'
import {
  calculatePaymentAmounts,
  type PaymentPlan,
} from '@/lib/payment-plan'
import { isMissingColumnError, resolvePromoDiscount } from '@/lib/promo'
import { isRazorpayConfigured, razorpay } from '@/lib/razorpay'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

const VALID_SLUGS = ['batch-a', 'batch-b']

function devOrderResponse(
  applicantId: string,
  batchSlug: string,
  chargeNow: number,
  totalDue: number,
  paymentPlan: PaymentPlan
) {
  return NextResponse.json({
    orderId: `dev_order_${applicantId}`,
    amount: chargeNow,
    totalAmount: totalDue,
    balanceDue: paymentPlan === 'deposit' ? totalDue - chargeNow : 0,
    paymentPlan,
    currency: 'INR',
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dev_key',
    dev: true,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { applicantId, name, phone, gender, batchSlug, dateChoice, promoCode, paymentPlan } =
      body

    const plan: PaymentPlan = paymentPlan === 'deposit' ? 'deposit' : 'full'

    if (!applicantId) {
      return NextResponse.json({ error: 'applicantId required' }, { status: 400 })
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'name required' }, { status: 400 })
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: 'phone required' }, { status: 400 })
    }
    if (!gender || !['m', 'f'].includes(gender)) {
      return NextResponse.json({ error: 'gender required' }, { status: 400 })
    }
    if (!batchSlug || !VALID_SLUGS.includes(batchSlug)) {
      return NextResponse.json({ error: 'batchSlug required' }, { status: 400 })
    }
    if (dateChoice === undefined || dateChoice === null || dateChoice === '') {
      return NextResponse.json({ error: 'dateChoice required' }, { status: 400 })
    }

    const supabase = tryCreateServiceRoleClient()
    if (!supabase) {
      if (isDevelopment()) {
        const fallbackTotal = batchSlug === 'batch-b' ? 2299900 : 1899900
        const { chargeNow, balanceDue, totalDue } = calculatePaymentAmounts(
          fallbackTotal,
          plan
        )
        return devOrderResponse(applicantId, batchSlug, chargeNow, totalDue, plan)
      }
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('price')
      .eq('slug', batchSlug)
      .single()

    if (batchError || !batch?.price) throw batchError ?? new Error('Batch not found')

    const originalAmount = batch.price * 100
    let discountAmount = 0
    let finalAmount = originalAmount
    let promoCodeId: string | null = null
    let influencerId: string | null = null
    let priorityReview = false

    if (promoCode?.trim()) {
      const promoResult = await resolvePromoDiscount(
        supabase,
        promoCode,
        batchSlug,
        originalAmount
      )
      if (!promoResult.valid) {
        return NextResponse.json(
          { error: promoResult.error || 'Invalid promo code' },
          { status: 400 }
        )
      }
      discountAmount = promoResult.discountAmount ?? 0
      finalAmount = promoResult.finalAmount ?? originalAmount
      const promoId = promoResult.promo?.id
      promoCodeId = promoId && promoId !== 'static' ? promoId : null
      const infId = promoResult.promo?.influencer_id
      influencerId = infId && infId !== 'static' ? infId : null
      priorityReview = promoResult.grantsPriority ?? false
    }

    const { chargeNow, balanceDue, totalDue } = calculatePaymentAmounts(finalAmount, plan)

    const baseUpdate = {
      name: name.trim(),
      phone: phone.trim(),
      gender,
      batch_slug: batchSlug,
      date_choice: String(dateChoice),
    }

    const extendedUpdate = {
      promo_code_id: promoCodeId,
      influencer_id: influencerId,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: totalDue,
      priority_review: priorityReview,
      payment_plan: plan,
      amount_paid: chargeNow,
      balance_due: balanceDue,
    }

    const { error: baseError } = await supabase
      .from('applicants')
      .update(baseUpdate)
      .eq('id', applicantId)

    if (baseError) throw baseError

    const { error: extendedError } = await supabase
      .from('applicants')
      .update(extendedUpdate)
      .eq('id', applicantId)

    if (extendedError && !isMissingColumnError(extendedError)) {
      console.warn('[POST /api/apply] extended fields not saved:', extendedError.message)
    }

    if (!isRazorpayConfigured()) {
      if (isDevelopment()) {
        return NextResponse.json({
          orderId: `dev_order_${applicantId}`,
          amount: chargeNow,
          totalAmount: totalDue,
          balanceDue,
          paymentPlan: plan,
          originalAmount,
          discountAmount,
          currency: 'INR',
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dev_key',
          dev: true,
        })
      }
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
    }

    const order = await razorpay.orders.create({
      amount: chargeNow,
      currency: 'INR',
      receipt: applicantId,
      notes: { payment_plan: plan },
    })

    const { error: orderError } = await supabase
      .from('applicants')
      .update({ razorpay_order_id: order.id })
      .eq('id', applicantId)

    if (orderError) throw orderError

    return NextResponse.json({
      orderId: order.id,
      amount: chargeNow,
      totalAmount: totalDue,
      balanceDue,
      paymentPlan: plan,
      originalAmount,
      discountAmount,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error('[POST /api/apply]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
