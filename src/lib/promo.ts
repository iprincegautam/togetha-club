import type { SupabaseClient } from '@supabase/supabase-js'
import { isDevelopment } from '@/lib/is-dev'

export type DiscountType = 'percent' | 'fixed_inr'

export interface PromoCodeRow {
  id: string
  code: string
  influencer_id: string
  discount_type: DiscountType
  discount_value: number
  commission_amount: number
  grants_priority: boolean
  max_uses: number | null
  uses_count: number
  valid_from: string | null
  valid_until: string | null
  batch_slugs: string[] | null
  active: boolean
}

export interface PromoValidationResult {
  valid: boolean
  error?: string
  promo?: PromoCodeRow
  originalAmount?: number
  discountAmount?: number
  finalAmount?: number
  grantsPriority?: boolean
}

const MIN_FINAL_PAISE = 100

const STATIC_PROMO_CODES: Record<
  string,
  { discountType: DiscountType; discountValue: number; grantsPriority: boolean }
> = {
  SARAH200: { discountType: 'fixed_inr', discountValue: 2000, grantsPriority: true },
}

let promoSchemaUnavailableCache: boolean | null = null

/** True when migration 002 has not been applied (promo_codes missing). */
export async function isPromoSchemaUnavailable(
  supabase: SupabaseClient
): Promise<boolean> {
  if (promoSchemaUnavailableCache !== null) return promoSchemaUnavailableCache
  const { error } = await supabase.from('promo_codes').select('id').limit(1)
  promoSchemaUnavailableCache =
    error?.code === 'PGRST205' ||
    (typeof error?.message === 'string' && error.message.includes('schema cache'))
  return promoSchemaUnavailableCache
}

function tryStaticPromoFallback(
  code: string,
  _batchSlug: string,
  originalAmountPaise: number
): PromoValidationResult | null {
  const config = STATIC_PROMO_CODES[normalizePromoCode(code)]
  if (!config) return null

  const { discountAmount, finalAmount } = calculateDiscount(
    originalAmountPaise,
    config.discountType,
    config.discountValue
  )

  return {
    valid: true,
    promo: {
      id: 'static',
      code: normalizePromoCode(code),
      influencer_id: 'static',
      discount_type: config.discountType,
      discount_value: config.discountValue,
      commission_amount: 0,
      grants_priority: config.grantsPriority,
      max_uses: null,
      uses_count: 0,
      valid_from: null,
      valid_until: null,
      batch_slugs: null,
      active: true,
    },
    originalAmount: originalAmountPaise,
    discountAmount,
    finalAmount,
    grantsPriority: config.grantsPriority,
  }
}

/** Dev-only shortcut (also used by tests). */
export function tryDevPromoFallback(
  code: string,
  batchSlug: string,
  originalAmountPaise: number
): PromoValidationResult | null {
  if (!isDevelopment()) return null
  return tryStaticPromoFallback(code, batchSlug, originalAmountPaise)
}

/** DB validation with static fallback while migration 002 is pending. */
export async function resolvePromoDiscount(
  supabase: SupabaseClient,
  code: string,
  batchSlug: string,
  originalAmountPaise: number
): Promise<PromoValidationResult> {
  const schemaMissing = await isPromoSchemaUnavailable(supabase)
  if (!schemaMissing) {
    const dbResult = await validatePromoCode(supabase, code, batchSlug, originalAmountPaise)
    if (dbResult.valid) return dbResult
    return dbResult
  }

  const staticResult = tryStaticPromoFallback(code, batchSlug, originalAmountPaise)
  if (staticResult) return staticResult

  return { valid: false, error: 'Invalid promo code.' }
}

/** Postgres undefined column or PostgREST unknown column in schema cache. */
export function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === '42703' || error.code === 'PGRST204') return true
  return (
    typeof error.message === 'string' &&
    /column.*does not exist|Could not find the .* column/i.test(error.message)
  )
}

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase()
}

export function calculateDiscount(
  originalAmountPaise: number,
  discountType: DiscountType,
  discountValue: number
): { discountAmount: number; finalAmount: number } {
  let discountAmount = 0

  if (discountType === 'percent') {
    discountAmount = Math.round((originalAmountPaise * discountValue) / 100)
  } else {
    discountAmount = discountValue * 100
  }

  discountAmount = Math.min(discountAmount, originalAmountPaise - MIN_FINAL_PAISE)
  discountAmount = Math.max(0, discountAmount)

  const finalAmount = originalAmountPaise - discountAmount
  return { discountAmount, finalAmount }
}

function isWithinDateWindow(promo: PromoCodeRow, now = new Date()): boolean {
  if (promo.valid_from && new Date(promo.valid_from) > now) return false
  if (promo.valid_until && new Date(promo.valid_until) < now) return false
  return true
}

export async function fetchPromoByCode(
  supabase: SupabaseClient,
  code: string
): Promise<PromoCodeRow | null> {
  const normalized = normalizePromoCode(code)
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', normalized)
    .maybeSingle()

  if (error || !data) return null
  return data as PromoCodeRow
}

export async function validatePromoCode(
  supabase: SupabaseClient,
  code: string,
  batchSlug: string,
  originalAmountPaise: number
): Promise<PromoValidationResult> {
  const normalized = normalizePromoCode(code)
  if (!normalized) {
    return { valid: false, error: 'Please enter a promo code.' }
  }

  const promo = await fetchPromoByCode(supabase, normalized)
  if (!promo) {
    return { valid: false, error: 'Invalid promo code.' }
  }

  if (!promo.active) {
    return { valid: false, error: 'This promo code is no longer active.' }
  }

  if (!isWithinDateWindow(promo)) {
    return { valid: false, error: 'This promo code has expired or is not yet valid.' }
  }

  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return { valid: false, error: 'This promo code has reached its usage limit.' }
  }

  if (promo.batch_slugs?.length && !promo.batch_slugs.includes(batchSlug)) {
    return { valid: false, error: 'This promo code is not valid for this batch.' }
  }

  const { discountAmount, finalAmount } = calculateDiscount(
    originalAmountPaise,
    promo.discount_type,
    promo.discount_value
  )

  return {
    valid: true,
    promo,
    originalAmount: originalAmountPaise,
    discountAmount,
    finalAmount,
    grantsPriority: promo.grants_priority,
  }
}

export async function recordPromoRedemption(
  supabase: SupabaseClient,
  applicantId: string
): Promise<void> {
  const { data: applicant, error: fetchError } = await supabase
    .from('applicants')
    .select('promo_code_id, influencer_id, discount_amount')
    .eq('id', applicantId)
    .single()

  if (fetchError || !applicant?.promo_code_id || !applicant.influencer_id) return

  const { data: existing } = await supabase
    .from('promo_redemptions')
    .select('id')
    .eq('applicant_id', applicantId)
    .maybeSingle()

  if (existing) return

  const { data: promo } = await supabase
    .from('promo_codes')
    .select('commission_amount, uses_count')
    .eq('id', applicant.promo_code_id)
    .single()

  if (!promo) return

  const { error: insertError } = await supabase.from('promo_redemptions').insert({
    promo_code_id: applicant.promo_code_id,
    applicant_id: applicantId,
    influencer_id: applicant.influencer_id,
    discount_amount: applicant.discount_amount ?? 0,
    commission_amount: promo.commission_amount,
    status: 'pending',
  })

  if (insertError?.code === '23514') {
    await supabase.from('promo_redemptions').insert({
      promo_code_id: applicant.promo_code_id,
      applicant_id: applicantId,
      influencer_id: applicant.influencer_id,
      discount_amount: applicant.discount_amount ?? 0,
      commission_amount: promo.commission_amount,
      status: 'paid',
    })
  } else if (insertError) {
    console.error('[recordPromoRedemption] insert', insertError)
    return
  }

  await supabase
    .from('promo_codes')
    .update({ uses_count: (promo.uses_count ?? 0) + 1 })
    .eq('id', applicant.promo_code_id)
}
