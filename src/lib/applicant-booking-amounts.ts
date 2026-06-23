/**
 * Booking amounts for one applicant — always prefer values stored on `applicants`
 * at checkout (paise). Do not substitute marketing/catalog batch prices for
 * customers who already have a booking row.
 */

export type ApplicantAmountFields = {
  original_amount?: number | null
  final_amount?: number | null
  discount_amount?: number | null
  amount_paid?: number | null
  balance_due?: number | null
  payment_plan?: string | null
  status?: string | null
}

export type ApplicantBookingAmounts = {
  originalAmountPaise: number | null
  finalAmountPaise: number | null
  discountAmountPaise: number | null
  amountPaidPaise: number
  balanceDuePaise: number
  /** amount_paid + balance_due matches final_amount (when final is set). */
  isConsistent: boolean
  /** Sum verified from ledger, if provided. */
  ledgerTotalPaidPaise?: number
}

export function bookingAmountsFromApplicant(
  applicant: ApplicantAmountFields,
  ledgerTotalPaidPaise?: number
): ApplicantBookingAmounts {
  const originalAmountPaise =
    applicant.original_amount != null && applicant.original_amount > 0
      ? applicant.original_amount
      : null
  const finalAmountPaise =
    applicant.final_amount != null && applicant.final_amount > 0
      ? applicant.final_amount
      : null
  const discountAmountPaise =
    applicant.discount_amount != null && applicant.discount_amount > 0
      ? applicant.discount_amount
      : null
  const amountPaidPaise = Math.max(0, applicant.amount_paid ?? 0)
  const balanceDuePaise = Math.max(0, applicant.balance_due ?? 0)

  let isConsistent = true
  if (finalAmountPaise != null) {
    const computed = amountPaidPaise + balanceDuePaise
    isConsistent = computed === finalAmountPaise
  }

  return {
    originalAmountPaise,
    finalAmountPaise,
    discountAmountPaise,
    amountPaidPaise,
    balanceDuePaise,
    isConsistent,
    ledgerTotalPaidPaise,
  }
}

/** Label for portal copy — uses this member's stored trip total, not catalog price. */
export function bookingPackageLabelFromApplicant(applicant: ApplicantAmountFields): string | null {
  const { finalAmountPaise, originalAmountPaise } = bookingAmountsFromApplicant(applicant)
  const paise = finalAmountPaise ?? originalAmountPaise
  if (paise == null || paise <= 0) return null
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`
}

export function assertBookingAmountsForEmail(
  amounts: ApplicantBookingAmounts
): { ok: true } | { ok: false; error: string } {
  if (amounts.balanceDuePaise <= 0) {
    return { ok: false, error: 'No balance due on this booking row.' }
  }
  if (amounts.amountPaidPaise <= 0) {
    return {
      ok: false,
      error: 'amount_paid is zero — fix the applicant row before sending a balance reminder.',
    }
  }
  if (amounts.finalAmountPaise == null) {
    return {
      ok: false,
      error: 'final_amount is missing — checkout totals were never saved for this applicant.',
    }
  }
  if (!amounts.isConsistent) {
    return {
      ok: false,
      error: `Booking totals inconsistent: paid (${amounts.amountPaidPaise}) + balance (${amounts.balanceDuePaise}) ≠ final (${amounts.finalAmountPaise}). Fix in Supabase before emailing.`,
    }
  }
  return { ok: true }
}
