export type PaymentPlan = 'deposit' | 'full'

export const DEPOSIT_PERCENT = 30
const MIN_CHARGE_PAISE = 100

export function calculatePaymentAmounts(
  totalDuePaise: number,
  plan: PaymentPlan
): { chargeNow: number; balanceDue: number; totalDue: number } {
  if (totalDuePaise < MIN_CHARGE_PAISE) {
    return { chargeNow: totalDuePaise, balanceDue: 0, totalDue: totalDuePaise }
  }

  const rawDeposit = Math.round((totalDuePaise * DEPOSIT_PERCENT) / 100)
  const depositPaise = Math.max(
    MIN_CHARGE_PAISE,
    Math.min(totalDuePaise - MIN_CHARGE_PAISE, rawDeposit)
  )

  const chargeNow = plan === 'full' ? totalDuePaise : depositPaise
  const balanceDue = plan === 'full' ? 0 : totalDuePaise - depositPaise

  return { chargeNow, balanceDue, totalDue: totalDuePaise }
}

export function depositAmountForTotal(totalDuePaise: number): number {
  return calculatePaymentAmounts(totalDuePaise, 'deposit').chargeNow
}

/** Slot-booking copy for marketing pages — matches checkout deposit math. */
export function slotBookingInstallmentLabel(totalRupees: number): string {
  const depositPaise = depositAmountForTotal(totalRupees * 100)
  const depositRupees = Math.round(depositPaise / 100)
  const formatted = `₹${depositRupees.toLocaleString('en-IN')}`
  return `✦ Pay ${formatted} now · rest after you're approved`
}

export function statusForPaymentPlan(plan: PaymentPlan): 'paid' | 'deposit_paid' {
  return plan === 'full' ? 'paid' : 'deposit_paid'
}
