import { NextRequest, NextResponse } from 'next/server'
import { normalizePromoCode, resolvePromoDiscount } from '@/lib/promo'
import { batchPriceFallbackPaise } from '@/lib/batch-price-fallbacks'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

const VALID_SLUGS = ['batch-a', 'batch-b', 'batch-d', 'batch-e']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, batchSlug, originalAmount } = body

    if (!code?.trim()) {
      return NextResponse.json({ valid: false, error: 'Promo code required' }, { status: 400 })
    }
    if (!batchSlug || !VALID_SLUGS.includes(batchSlug)) {
      return NextResponse.json({ valid: false, error: 'Invalid batch' }, { status: 400 })
    }

    const supabase = tryCreateServiceRoleClient()

    let amountPaise = originalAmount
    if (!amountPaise && supabase) {
      const { data: batch } = await supabase
        .from('batches')
        .select('price')
        .eq('slug', batchSlug)
        .single()
      if (!batch?.price) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
      }
      amountPaise = batch.price * 100
    }
    if (!amountPaise) {
      amountPaise = batchPriceFallbackPaise(batchSlug)
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const result = await resolvePromoDiscount(supabase, code, batchSlug, amountPaise)

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        error: result.error,
      })
    }

    const normalizedCode = result.promo?.code ?? normalizePromoCode(code)

    return NextResponse.json({
      valid: true,
      code: normalizedCode,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      originalAmount: result.originalAmount,
      grantsPriority: result.grantsPriority,
      message:
        result.discountAmount && result.discountAmount > 0
          ? `You save ₹${(result.discountAmount / 100).toLocaleString('en-IN')}!`
          : 'Promo code applied.',
    })
  } catch (err) {
    console.error('[POST /api/promo/validate]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
