declare global {
  interface Window {
    fbq?: (command: string, event: string, params?: Record<string, unknown>) => void
  }
}

const PURCHASE_SESSION_KEY = 'togetha_meta_purchase'

type PendingMetaPurchase = {
  transactionId: string
  valueInRupees: number
}

export type FunnelStage = 'quiz-started' | 'match-result' | 'checkout' | 'confirmed'

/** Update URL with ?stage= so Meta custom conversions can match URL rules. */
export function setFunnelStageUrl(stage: FunnelStage): void {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('stage', stage)
    window.history.replaceState(window.history.state, '', url.toString())
  } catch {
    // Ignore invalid URLs in embedded contexts.
  }
}

/** Fire a Meta Pixel standard event (no-op if pixel is not loaded). */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  window.fbq?.('track', event, params)
}

/** TC · Quiz Started — first active intent on question 1. */
export function trackQuizStarted(): void {
  setFunnelStageUrl('quiz-started')
  trackMetaEvent('ViewContent', {
    content_name: 'Quiz Started',
    content_category: 'matchmaking_quiz',
  })
}

/** TC · Match Result Shown — result screen mounts after preview API responds. */
export function trackMatchResultShown(): void {
  setFunnelStageUrl('match-result')
  trackMetaEvent('Lead', {
    content_name: 'Match Result Shown',
    content_category: 'batch_match',
    value: 0,
    currency: 'INR',
  })
}

/** TC · Payment Initiated — Razorpay checkout modal opens (batch slot deposit). */
export function trackPaymentInitiated(valueInRupees: number): void {
  setFunnelStageUrl('checkout')
  trackMetaEvent('InitiateCheckout', {
    value: valueInRupees,
    currency: 'INR',
    content_name: 'Batch Slot Deposit',
    num_items: 1,
  })
}

/** TC · Slot Confirmed — Razorpay payment verified (primary KPI). */
export function trackPurchase(valueInRupees: number, transactionId: string): void {
  trackMetaEvent('Purchase', {
    value: valueInRupees,
    currency: 'INR',
    content_name: 'Batch Slot Deposit',
    content_type: 'product',
    transaction_id: transactionId,
  })
}

/** Persist purchase for /confirmation backup if the Razorpay handler is interrupted. */
export function rememberPurchaseForConfirmation(
  valueInRupees: number,
  transactionId: string
): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(
      PURCHASE_SESSION_KEY,
      JSON.stringify({ transactionId, valueInRupees } satisfies PendingMetaPurchase)
    )
  } catch {
    // Private browsing or storage full — pixel handler already fired.
  }
}

export function trackPurchaseWithConfirmationBackup(
  valueInRupees: number,
  transactionId: string
): void {
  trackPurchase(valueInRupees, transactionId)
  rememberPurchaseForConfirmation(valueInRupees, transactionId)
}

/** URL backup on /confirmation — Meta dedupes via transaction_id. */
export function trackPendingPurchaseOnConfirmationPage(): void {
  if (typeof sessionStorage === 'undefined') return

  setFunnelStageUrl('confirmed')

  const raw = sessionStorage.getItem(PURCHASE_SESSION_KEY)
  if (!raw) return

  sessionStorage.removeItem(PURCHASE_SESSION_KEY)

  try {
    const pending = JSON.parse(raw) as PendingMetaPurchase
    if (!pending.transactionId || !pending.valueInRupees) return
    trackPurchase(pending.valueInRupees, pending.transactionId)
  } catch {
    // Ignore corrupt session payload.
  }
}
