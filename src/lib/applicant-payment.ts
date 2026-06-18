import type { PaymentPlan } from '@/lib/payment-plan'

export type ApplicantPaymentFields = {
  razorpay_payment_id: string | null
  razorpay_order_id?: string | null
  amount_paid: number | null
  balance_due: number | null
  final_amount: number | null
  payment_plan: string | null
}

export function hasVerifiedPayment(applicant: ApplicantPaymentFields): boolean {
  return Boolean(applicant.razorpay_payment_id)
}

/** Paid applicants eligible for member portal credentials (support resend). */
export function canResendMemberCredentials(applicant: {
  razorpay_payment_id: string | null
  status?: string | null
}): boolean {
  if (applicant.razorpay_payment_id) return true
  return applicant.status === 'deposit_paid' || applicant.status === 'paid'
}

export function formatPaiseInr(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`
}

export function applicantAmountPaidLabel(applicant: ApplicantPaymentFields): string {
  if (!hasVerifiedPayment(applicant)) return 'Not paid yet'
  if (applicant.amount_paid == null || applicant.amount_paid <= 0) return 'Not paid yet'
  return formatPaiseInr(applicant.amount_paid)
}

export function applicantBalanceDueLabel(applicant: ApplicantPaymentFields): string {
  if (!hasVerifiedPayment(applicant)) {
    if (applicant.final_amount != null && applicant.final_amount > 0) {
      return `${formatPaiseInr(applicant.final_amount)} (checkout not completed)`
    }
    return '—'
  }
  if (applicant.balance_due == null || applicant.balance_due <= 0) return '₹0'
  return formatPaiseInr(applicant.balance_due)
}

export function checkoutAmountDuePaise(
  totalDuePaise: number,
  plan: PaymentPlan
): { chargeNow: number; balanceAfterDeposit: number } {
  if (plan === 'full') {
    return { chargeNow: totalDuePaise, balanceAfterDeposit: 0 }
  }
  const rawDeposit = Math.round((totalDuePaise * 30) / 100)
  const depositPaise = Math.max(100, Math.min(totalDuePaise - 100, rawDeposit))
  return {
    chargeNow: depositPaise,
    balanceAfterDeposit: totalDuePaise - depositPaise,
  }
}
