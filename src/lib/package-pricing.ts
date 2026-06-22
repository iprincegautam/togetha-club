import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateDiscount, normalizePromoCode, type DiscountType } from '@/lib/promo'
import { calculatePaymentAmounts, type PaymentPlan } from '@/lib/payment-plan'

const OPEN_BATCH_SLUGS = ['batch-a', 'batch-b'] as const

/** Offline fallback when DB is unavailable (rupees). */
const FALLBACK_OPEN_BATCH_PRICES_RUPEES = [18999, 22999]

/** Built-in coupon codes for direct sales (max 10% off package). */
export const DIRECT_SALE_COUPONS: Record<
  string,
  { discountType: DiscountType; discountValue: number; label: string }
> = {
  STANDARD: { discountType: 'percent', discountValue: 10, label: 'Standard 10% off' },
  MAX: { discountType: 'percent', discountValue: 10, label: 'Maximum 10% off' },
}

function fallbackPackagePricePaise(): number {
  return Math.max(...FALLBACK_OPEN_BATCH_PRICES_RUPEES) * 100
}

/** Load package price in paise from `batches.price` (rupees × 100). */
export async function fetchPackagePricePaise(
  supabase: SupabaseClient,
  batchSlug?: string | null
): Promise<number> {
  if (batchSlug) {
    const { data } = await supabase
      .from('batches')
      .select('price, status')
      .eq('slug', batchSlug)
      .maybeSingle()

    if (data?.price != null && data.status !== 'coming_soon') {
      return data.price * 100
    }
  }

  const { data: batches } = await supabase
    .from('batches')
    .select('price, status')
    .in('slug', [...OPEN_BATCH_SLUGS])

  const prices = (batches ?? [])
    .filter((b) => b.status === 'open' && b.price != null)
    .map((b) => b.price! * 100)

  if (prices.length) return Math.max(...prices)

  return fallbackPackagePricePaise()
}

/** Prefer batch-specific DB price, then stored applicant amount, then default package price. */
export async function resolveApplicantPackagePricePaise(
  supabase: SupabaseClient,
  applicant: { batch_slug?: string | null; original_amount?: number | null }
): Promise<number> {
  if (applicant.batch_slug) {
    return fetchPackagePricePaise(supabase, applicant.batch_slug)
  }
  if (applicant.original_amount != null && applicant.original_amount > 0) {
    return applicant.original_amount
  }
  return fetchPackagePricePaise(supabase)
}

export function isDirectSaleCoupon(code: string): boolean {
  return normalizePromoCode(code) in DIRECT_SALE_COUPONS
}

export function resolveDirectSaleCoupon(
  code: string | null | undefined,
  originalAmountPaise: number
) {
  if (!code?.trim()) return null
  const normalized = normalizePromoCode(code)
  const config = DIRECT_SALE_COUPONS[normalized]
  if (!config) return null
  const { discountAmount, finalAmount } = calculateDiscount(
    originalAmountPaise,
    config.discountType,
    config.discountValue
  )
  return {
    code: normalized,
    label: config.label,
    discountType: config.discountType,
    discountValue: config.discountValue,
    originalAmount: originalAmountPaise,
    discountAmount,
    finalAmount,
  }
}

export type PaymentAmountMatch = {
  plan: PaymentPlan
  couponCode: string | null
  originalAmount: number
  discountAmount: number
  finalAmount: number
  amountPaid: number
  balanceDue: number
}

/** Match a Razorpay captured amount to full/deposit with optional direct-sale coupon. */
export function matchPaymentAmount(
  paidPaise: number,
  originalAmountPaise: number,
  couponCode?: string | null
): PaymentAmountMatch | null {
  const coupon = resolveDirectSaleCoupon(couponCode ?? null, originalAmountPaise)
  if (couponCode?.trim() && !coupon) return null

  const finalAmount = coupon?.finalAmount ?? originalAmountPaise
  return matchPaymentAmountForTotals(
    paidPaise,
    originalAmountPaise,
    finalAmount,
    coupon?.discountAmount ?? 0,
    coupon?.code ?? null
  )
}

/** Match payment against explicit original/final totals (DB promos or direct coupons). */
export function matchPaymentAmountForTotals(
  paidPaise: number,
  originalAmount: number,
  finalAmount: number,
  discountAmount: number,
  couponCode: string | null
): PaymentAmountMatch | null {
  const candidates: PaymentAmountMatch[] = [
    {
      plan: 'full',
      couponCode,
      originalAmount,
      discountAmount,
      finalAmount,
      amountPaid: finalAmount,
      balanceDue: 0,
    },
    {
      plan: 'deposit',
      couponCode,
      originalAmount,
      discountAmount,
      finalAmount,
      amountPaid: calculatePaymentAmounts(finalAmount, 'deposit').chargeNow,
      balanceDue: calculatePaymentAmounts(finalAmount, 'deposit').balanceDue,
    },
  ]

  return candidates.find((c) => c.amountPaid === paidPaise) ?? null
}

export function formatPaiseAsPackageInr(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`
}
