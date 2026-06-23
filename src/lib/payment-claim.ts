import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchPackagePricePaise,
  formatPaiseAsPackageInr,
  matchPaymentAmount,
  matchPaymentAmountForTotals,
  resolveApplicantPackagePricePaise,
  resolveDirectSaleCoupon,
  type PaymentAmountMatch,
} from '@/lib/package-pricing'
import { statusForPaymentPlan } from '@/lib/payment-plan'
import { normalizeIndianPhone, isValidIndianPhone } from '@/lib/phone'
import { normalizePromoCode, recordPromoRedemption, resolvePromoDiscount } from '@/lib/promo'
import { isDevelopment } from '@/lib/is-dev'
import {
  fetchRazorpayPayment,
  isPlaceholderRazorpayEmail,
  isRazorpayConfigured,
  isValidRazorpayPaymentId,
  normalizeRazorpayPaymentId,
} from '@/lib/razorpay'
import { sendConfirmationEmail } from '@/lib/resend'
import { stopNurtureSequence } from '@/lib/nurture/should-stop'
import { ensureMemberAccountForApplicant } from '@/lib/member-account'
import { paymentKindFromPlan, recordApplicantPayment } from '@/lib/applicant-payments'

export type ClaimPaymentResult =
  | {
      ok: true
      status: string
      paymentPlan: string
      amountPaid: number
      balanceDue: number
      discountAmount: number
      finalAmount: number
      couponCode: string | null
    }
  | { ok: false; error: string }

function paymentContactMatches(
  paymentEmail: string | undefined,
  paymentContact: string | undefined,
  applicantEmail: string,
  applicantPhone: string | null
): boolean {
  if (
    !isPlaceholderRazorpayEmail(paymentEmail) &&
    paymentEmail &&
    paymentEmail.trim().toLowerCase() === applicantEmail.trim().toLowerCase()
  ) {
    return true
  }

  if (!paymentContact || !applicantPhone) return false

  const payDigits = paymentContact.replace(/\D/g, '')
  const applicantDigits = normalizeIndianPhone(applicantPhone)
  if (applicantDigits.length !== 10) return false

  return (
    payDigits.endsWith(applicantDigits) ||
    payDigits.slice(-10) === applicantDigits ||
    applicantDigits === payDigits
  )
}

function phoneFromRazorpayContact(contact: string | undefined): string | null {
  if (!contact?.trim()) return null
  const digits = contact.replace(/\D/g, '')
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits
  const normalized = normalizeIndianPhone(last10)
  return isValidIndianPhone(normalized) ? normalized : null
}

/** Sync booking phone from Razorpay checkout when ops typed a different number at provision. */
async function syncPhoneFromPayment(
  service: SupabaseClient,
  applicantId: string,
  paymentContact: string | undefined
): Promise<string | null> {
  const paymentPhone = phoneFromRazorpayContact(paymentContact)
  if (!paymentPhone) return null

  await service.from('applicants').update({ phone: paymentPhone }).eq('id', applicantId)

  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('applicant_id', applicantId)
    .maybeSingle()

  if (profile?.id) {
    await service.from('profiles').update({ phone: paymentPhone }).eq('id', profile.id)
  }

  return paymentPhone
}

/** Local QA: accept captured payments that do not match package pricing (e.g. ₹1 smoke tests). */
function buildDevPaymentMatch(
  paidPaise: number,
  packagePricePaise: number,
  couponCode?: string | null
): PaymentAmountMatch | null {
  if (!isDevelopment() || paidPaise < 100) return null

  const coupon = resolveDirectSaleCoupon(couponCode ?? null, packagePricePaise)
  const originalAmount = packagePricePaise
  const finalAmount = coupon?.finalAmount ?? originalAmount
  const discountAmount = coupon?.discountAmount ?? 0

  if (paidPaise >= finalAmount) {
    return {
      plan: 'full',
      couponCode: coupon?.code ?? null,
      originalAmount,
      discountAmount,
      finalAmount,
      amountPaid: paidPaise,
      balanceDue: 0,
    }
  }

  return {
    plan: 'deposit',
    couponCode: coupon?.code ?? null,
    originalAmount,
    discountAmount,
    finalAmount,
    amountPaid: paidPaise,
    balanceDue: Math.max(0, finalAmount - paidPaise),
  }
}

export async function claimRazorpayPaymentForApplicant(
  service: SupabaseClient,
  input: {
    applicantId: string
    razorpayPaymentId: string
    couponCode?: string | null
  }
): Promise<ClaimPaymentResult> {
  if (!isRazorpayConfigured()) {
    return { ok: false, error: 'Payment verification is not configured on the server.' }
  }

  const paymentId = normalizeRazorpayPaymentId(input.razorpayPaymentId)
  if (!isValidRazorpayPaymentId(paymentId)) {
    return { ok: false, error: 'Enter a valid Razorpay payment ID (starts with pay_).' }
  }

  const { data: applicant, error: fetchError } = await service
    .from('applicants')
    .select(
      'id, email, name, phone, gender, batch_slug, status, razorpay_payment_id, payment_plan, original_amount'
    )
    .eq('id', input.applicantId)
    .maybeSingle()

  if (fetchError || !applicant) {
    return { ok: false, error: 'Booking record not found.' }
  }

  if (applicant.razorpay_payment_id) {
    if (applicant.razorpay_payment_id === paymentId) {
      return {
        ok: true,
        status: applicant.status,
        paymentPlan: applicant.payment_plan ?? 'full',
        amountPaid: 0,
        balanceDue: 0,
        discountAmount: 0,
        finalAmount: 0,
        couponCode: null,
      }
    }
    return { ok: false, error: 'A payment is already linked to this booking.' }
  }

  const { data: usedElsewhere } = await service
    .from('applicants')
    .select('id')
    .eq('razorpay_payment_id', paymentId)
    .neq('id', input.applicantId)
    .maybeSingle()

  if (usedElsewhere) {
    return { ok: false, error: 'This payment ID is already linked to another booking.' }
  }

  let payment
  try {
    payment = await fetchRazorpayPayment(paymentId)
  } catch (err) {
    console.error('[claimRazorpayPayment]', err)
    const message = err instanceof Error ? err.message : 'Could not find that payment in Razorpay.'
    return { ok: false, error: message }
  }

  if (payment.status !== 'captured') {
    return { ok: false, error: `Payment status is "${payment.status}" — only captured payments can be linked.` }
  }

  if (payment.currency && payment.currency !== 'INR') {
    return { ok: false, error: 'Only INR payments are supported.' }
  }

  if (
    !paymentContactMatches(payment.email, payment.contact, applicant.email, applicant.phone)
  ) {
    const syncedPhone = await syncPhoneFromPayment(service, input.applicantId, payment.contact)
    if (
      !syncedPhone ||
      !paymentContactMatches(payment.email, payment.contact, applicant.email, syncedPhone)
    ) {
      const phoneHint = applicant.phone
        ? ` Booking phone on file: ${applicant.phone}.`
        : ''
      return {
        ok: false,
        error:
          `Payment phone does not match your booking.${phoneHint} ` +
          'Use the same WhatsApp number you paid with, or contact hello@togetha.club.',
      }
    }
  }

  const packagePricePaise = await resolveApplicantPackagePricePaise(service, applicant)

  let originalAmount = packagePricePaise
  let finalAmount = packagePricePaise
  let discountAmount = 0
  let resolvedCouponCode: string | null = null
  let promoCodeId: string | null = null
  let influencerId: string | null = null

  if (input.couponCode?.trim()) {
    const direct = resolveDirectSaleCoupon(input.couponCode, packagePricePaise)
    if (direct) {
      originalAmount = direct.originalAmount
      finalAmount = direct.finalAmount
      discountAmount = direct.discountAmount
      resolvedCouponCode = direct.code
    } else {
      const promo = await resolvePromoDiscount(
        service,
        input.couponCode,
        applicant.batch_slug ?? 'batch-a',
        packagePricePaise
      )
      if (!promo.valid || promo.finalAmount == null) {
        return {
          ok: false,
          error: 'Invalid coupon code. Check the code and try again.',
        }
      }
      originalAmount = promo.originalAmount ?? packagePricePaise
      finalAmount = promo.finalAmount
      discountAmount = promo.discountAmount ?? 0
      resolvedCouponCode = normalizePromoCode(input.couponCode)
      promoCodeId = promo.promo?.id ?? null
      influencerId = promo.promo?.influencer_id ?? null
    }
  }

  let match = matchPaymentAmountForTotals(
    Number(payment.amount),
    originalAmount,
    finalAmount,
    discountAmount,
    resolvedCouponCode
  )
  if (!match && !input.couponCode?.trim()) {
    match = matchPaymentAmount(Number(payment.amount), packagePricePaise, input.couponCode)
  }
  if (!match) {
    match = buildDevPaymentMatch(Number(payment.amount), packagePricePaise, input.couponCode)
  }
  if (!match) {
    const couponHint = resolvedCouponCode ? ` with coupon ${resolvedCouponCode}` : ''
    const priceLabel = formatPaiseAsPackageInr(packagePricePaise)
    return {
      ok: false,
      error: `Payment amount does not match the package price${couponHint}. Expected full pay or 30% deposit for ${priceLabel} (with up to 10% coupon).`,
    }
  }

  const newStatus = statusForPaymentPlan(match.plan)

  const { error: updateError } = await service
    .from('applicants')
    .update({
      status: newStatus,
      razorpay_payment_id: paymentId,
      razorpay_order_id: payment.order_id ?? null,
      payment_plan: match.plan,
      original_amount: match.originalAmount,
      discount_amount: match.discountAmount,
      final_amount: match.finalAmount,
      amount_paid: match.amountPaid,
      balance_due: match.balanceDue,
      ...(promoCodeId ? { promo_code_id: promoCodeId, influencer_id: influencerId } : {}),
    })
    .eq('id', input.applicantId)

  if (updateError) {
    console.error('[claimRazorpayPayment] update', updateError)
    return { ok: false, error: 'Could not save payment to your booking.' }
  }

  await recordApplicantPayment(service, {
    applicantId: input.applicantId,
    razorpayPaymentId: paymentId,
    razorpayOrderId: payment.order_id ?? null,
    paymentKind: paymentKindFromPlan(match.plan, false),
    amountPaise: match.amountPaid,
  })

  if (match.plan === 'full') {
    await recordPromoRedemption(service, input.applicantId)
  }

  if (applicant.batch_slug && applicant.gender) {
    const spotField = applicant.gender === 'm' ? 'spots_taken_m' : 'spots_taken_f'
    const { data: batchRow } = await service
      .from('batches')
      .select(spotField)
      .eq('slug', applicant.batch_slug)
      .single()

    if (batchRow) {
      const current = (batchRow as Record<string, number>)[spotField] ?? 0
      await service
        .from('batches')
        .update({ [spotField]: current + 1 })
        .eq('slug', applicant.batch_slug)
    }
  }

  if (applicant.batch_slug && applicant.email) {
    const { data: batch } = await service
      .from('batches')
      .select('name')
      .eq('slug', applicant.batch_slug)
      .single()

    if (batch?.name) {
      await sendConfirmationEmail(applicant.email, applicant.name || 'there', batch.name)
    }
  }

  try {
    await stopNurtureSequence(service, input.applicantId, 'paid')
  } catch (nurtureErr) {
    console.warn('[claimRazorpayPayment] nurture stop failed', nurtureErr)
  }

  await ensureMemberAccountForApplicant(service, {
    applicantId: input.applicantId,
    email: applicant.email,
    name: applicant.name,
    phone: applicant.phone,
  })

  return {
    ok: true,
    status: newStatus,
    paymentPlan: match.plan,
    amountPaid: match.amountPaid,
    balanceDue: match.balanceDue,
    discountAmount: match.discountAmount,
    finalAmount: match.finalAmount,
    couponCode: match.couponCode,
  }
}

export function isProfileComplete(applicant: {
  quiz_answers?: unknown
  batch_slug?: string | null
  gender?: string | null
  profile_completed_at?: string | null
}): boolean {
  if (applicant.profile_completed_at) return true
  const answers = applicant.quiz_answers
  const hasQuiz =
    answers &&
    typeof answers === 'object' &&
    Object.keys(answers as Record<string, unknown>).length > 0
  return Boolean(hasQuiz && applicant.batch_slug && applicant.gender)
}
