import type { SupabaseClient } from '@supabase/supabase-js'
import type { PaymentPlan } from '@/lib/payment-plan'

export type ApplicantPaymentKind = 'deposit' | 'full' | 'balance' | 'claim'

export interface ApplicantPaymentRow {
  id: string
  applicant_id: string
  razorpay_payment_id: string
  razorpay_order_id: string | null
  payment_kind: ApplicantPaymentKind
  amount_paise: number
  currency: string
  captured_at: string
  created_at: string
}

const PAYMENT_KIND_LABELS: Record<ApplicantPaymentKind, string> = {
  deposit: 'Slot booking (deposit)',
  full: 'Paid in full',
  balance: 'Balance payment',
  claim: 'Payment linked',
}

export function paymentKindLabel(kind: ApplicantPaymentKind): string {
  return PAYMENT_KIND_LABELS[kind] ?? kind
}

export function paymentKindFromPlan(plan: PaymentPlan, isBalance = false): ApplicantPaymentKind {
  if (isBalance) return 'balance'
  return plan === 'deposit' ? 'deposit' : 'full'
}

export async function recordApplicantPayment(
  service: SupabaseClient,
  input: {
    applicantId: string
    razorpayPaymentId: string
    razorpayOrderId?: string | null
    paymentKind: ApplicantPaymentKind
    amountPaise: number
    capturedAt?: string
  }
): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const paymentId = input.razorpayPaymentId.trim()
  if (!paymentId.startsWith('pay_')) {
    return { ok: false, error: 'Invalid Razorpay payment ID' }
  }
  if (input.amountPaise < 100) {
    return { ok: false, error: 'Amount too small to record' }
  }

  const { data, error } = await service
    .from('applicant_payments')
    .upsert(
      {
        applicant_id: input.applicantId,
        razorpay_payment_id: paymentId,
        razorpay_order_id: input.razorpayOrderId ?? null,
        payment_kind: input.paymentKind,
        amount_paise: input.amountPaise,
        currency: 'INR',
        ...(input.capturedAt ? { captured_at: input.capturedAt } : {}),
      },
      { onConflict: 'razorpay_payment_id', ignoreDuplicates: true }
    )
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[recordApplicantPayment]', error.message, paymentId)
    return { ok: false, error: error.message }
  }

  return { ok: true, id: data?.id }
}

export async function listApplicantPayments(
  service: SupabaseClient,
  applicantId: string
): Promise<ApplicantPaymentRow[]> {
  const { data, error } = await service
    .from('applicant_payments')
    .select('*')
    .eq('applicant_id', applicantId)
    .order('captured_at', { ascending: true })

  if (error) {
    console.error('[listApplicantPayments]', error.message)
    return []
  }

  return (data ?? []) as ApplicantPaymentRow[]
}

export function summarizeApplicantPayments(payments: ApplicantPaymentRow[]): {
  totalPaidPaise: number
  paymentCount: number
} {
  return {
    totalPaidPaise: payments.reduce((sum, row) => sum + row.amount_paise, 0),
    paymentCount: payments.length,
  }
}

export function memberBalancePayUrl(siteUrl?: string): string {
  const base = siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://togetha.club'
  return `${base.replace(/\/$/, '')}/account/login?next=${encodeURIComponent('/account')}`
}
