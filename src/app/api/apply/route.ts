import { NextRequest, NextResponse } from 'next/server'
import { isDevelopment } from '@/lib/is-dev'
import { isMissingColumnError, resolvePromoDiscount } from '@/lib/promo'
import { isRazorpayConfigured, razorpay } from '@/lib/razorpay'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

const VALID_SLUGS = ['batch-a', 'batch-b']

function devOrderResponse(applicantId: string, batchSlug: string, amount?: number) {
  return NextResponse.json({
    orderId: `dev_order_${applicantId}`,
    amount: amount ?? (batchSlug === 'batch-b' ? 2299900 : 1899900),
    currency: 'INR',
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dev_key',
    dev: true,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { applicantId, name, phone, gender, batchSlug, dateChoice, promoCode } = body

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
        return devOrderResponse(applicantId, batchSlug)
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

    const fullUpdate = {
      name: name.trim(),
      phone: phone.trim(),
      gender,
      batch_slug: batchSlug,
      date_choice: String(dateChoice),
      promo_code_id: promoCodeId,
      influencer_id: influencerId,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      priority_review: priorityReview,
    }

    let { error: updateError } = await supabase
      .from('applicants')
      .update(fullUpdate)
      .eq('id', applicantId)

    if (updateError && isMissingColumnError(updateError)) {
      const {
        promo_code_id: _p,
        influencer_id: _i,
        original_amount: _o,
        discount_amount: _d,
        final_amount: _f,
        priority_review: _pr,
        ...baseUpdate
      } = fullUpdate
      ;({ error: updateError } = await supabase
        .from('applicants')
        .update(baseUpdate)
        .eq('id', applicantId))
    }

    if (updateError) throw updateError

    if (!isRazorpayConfigured()) {
      if (isDevelopment()) {
        return NextResponse.json({
          orderId: `dev_order_${applicantId}`,
          amount: finalAmount,
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
      amount: finalAmount,
      currency: 'INR',
      receipt: applicantId,
    })

    const { error: orderError } = await supabase
      .from('applicants')
      .update({ razorpay_order_id: order.id })
      .eq('id', applicantId)

    if (orderError) throw orderError

    return NextResponse.json({
      orderId: order.id,
      amount: finalAmount,
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
