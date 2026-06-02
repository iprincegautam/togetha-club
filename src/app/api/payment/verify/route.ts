import { NextRequest, NextResponse } from 'next/server'
import { isDevelopment } from '@/lib/is-dev'
import { isRazorpayConfigured, verifyRazorpaySignature } from '@/lib/razorpay'
import { sendConfirmationEmail } from '@/lib/resend'
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

    const { error: updateError } = await supabase
      .from('applicants')
      .update({
        status: 'paid',
        razorpay_payment_id: razorpayPaymentId,
      })
      .eq('id', applicantId)

    if (updateError) throw updateError

    const { data: applicant, error: fetchError } = await supabase
      .from('applicants')
      .select('name, email, gender, batch_slug')
      .eq('id', applicantId)
      .single()

    if (fetchError || !applicant) throw fetchError ?? new Error('Applicant not found')

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

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/payment/verify]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
