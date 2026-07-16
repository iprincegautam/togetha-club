import { formatPaise } from '@/lib/utils'
import { memberBalancePayUrl } from '@/lib/applicant-payments'

const WRAPPER_STYLE =
  'margin:0;padding:0;background:#f5edd8;font-family:Georgia,serif;color:#2c1810;'

const CARD_STYLE =
  'background:#fffef9;border:2px solid #2c1810;border-radius:4px;padding:28px 24px;box-shadow:4px 4px 0 #2c1810;'

function emailShell(body: string): string {
  return `<!DOCTYPE html>
<html>
<body style="${WRAPPER_STYLE}">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="${CARD_STYLE}">
      ${body}
      <p style="margin:28px 0 0;font-size:13px;color:#6b5344;font-style:italic;">— Togetha.Club</p>
    </div>
    <p style="text-align:center;font-size:11px;color:#6b5344;margin-top:16px;">
      Questions? Reply to this email or WhatsApp us — hello@togetha.club
    </p>
  </div>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:24px 0 0;text-align:center;">
  <a href="${href}" style="display:inline-block;background:#1a6b5a;color:#f5edd8;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:14px 24px;border-radius:3px;border:2px solid #2c1810;box-shadow:3px 3px 0 #2c1810;">${label}</a>
</p>`
}

export function renderBalancePaymentReminderEmail(opts: {
  name: string
  batchName: string
  balanceDuePaise: number
  amountPaidPaise: number
  finalAmountPaise: number | null
  originalAmountPaise?: number | null
  discountAmountPaise?: number | null
  departureLabel?: string | null
  payUrl: string
}): { subject: string; text: string; html: string } {
  const firstName = opts.name.split(/\s+/)[0] || opts.name
  const balance = formatPaise(opts.balanceDuePaise)
  const paidSoFar = formatPaise(opts.amountPaidPaise)
  const total =
    opts.finalAmountPaise != null ? formatPaise(opts.finalAmountPaise) : null
  const listPrice =
    opts.originalAmountPaise != null &&
    opts.finalAmountPaise != null &&
    opts.originalAmountPaise > opts.finalAmountPaise
      ? formatPaise(opts.originalAmountPaise)
      : null
  const discount =
    opts.discountAmountPaise != null && opts.discountAmountPaise > 0
      ? formatPaise(opts.discountAmountPaise)
      : null
  const departureLine = opts.departureLabel
    ? `Your departure: ${opts.departureLabel}.`
    : 'Your departure is coming up.'

  const totalLine = total
    ? listPrice && discount
      ? `Package ${listPrice} · discount ${discount} · your total ${total}`
      : `Your trip total is ${total}`
    : null

  const subject = `✦ You're approved — pay ${balance} within 48 hours to lock your spot`

  const text = `Hi ${firstName},

Great news — your profile is approved for ${opts.batchName}. ${departureLine}
${totalLine ? `${totalLine}.\n` : ''}
You've paid ${paidSoFar} so far${total ? ` toward ${total}` : ''}. The remaining balance is ${balance}. Please pay it within 48 hours to confirm your spot. If we don't receive it in time, your slot is released to someone on the waitlist and 50% of your booking amount is refunded.

Pay securely on your member portal (same email you booked with):
${opts.payUrl}

After you log in, scroll to "Pay remaining balance" — Razorpay checkout takes under a minute.

If you've already paid, ignore this — we'll reconcile within 24 hours.

See you soon,
Togetha.Club
hello@togetha.club`

  const pricingBlock =
    totalLine != null
      ? `<p style="margin:0 0 6px;"><strong>Trip total:</strong> ${total}${listPrice && discount ? ` <span style="color:#6b5344;">(${listPrice} − ${discount} discount)</span>` : ''}</p>`
      : ''

  const html = emailShell(`
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#1a6b5a;">✦ You're approved ✦</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.3;">Hi ${firstName}, pay within 48 hours to lock your spot</h1>
    <p style="margin:0 0 16px;line-height:1.6;">Great news — your profile is approved for <strong>${opts.batchName}</strong>. ${departureLine}</p>
    <div style="margin:20px 0;padding:16px 18px;background:#f5edd8;border:1px dashed #2c1810;border-radius:4px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.7;">
      ${pricingBlock}
      <p style="margin:0 0 6px;"><strong>Paid so far:</strong> ${paidSoFar}${total ? ` of ${total}` : ''}</p>
      <p style="margin:0;font-size:16px;"><strong>Balance due now:</strong> ${balance}</p>
    </div>
    <p style="margin:0;line-height:1.6;">Please pay within <strong>48 hours</strong> to confirm your spot. If we don't receive it in time, your slot is released and 50% of your booking amount is refunded. Log in with your booking email, then use <strong>Pay remaining balance</strong> on your dashboard — same secure Razorpay checkout as when you booked your slot.</p>
    ${ctaButton(opts.payUrl, `Pay ${balance} →`)}
    <p style="margin:20px 0 0;font-size:13px;color:#6b5344;line-height:1.5;">Already paid? Ignore this — we'll update your booking within 24 hours.</p>
  `)

  return { subject, text, html }
}

export function renderSlotReleasedEmail(opts: {
  name: string
  batchName: string
  amountPaidPaise: number
  refundPaise: number
  retainedPaise: number
  forfeitPercent: number
}): { subject: string; text: string; html: string } {
  const firstName = opts.name.split(/\s+/)[0] || opts.name
  const refund = formatPaise(opts.refundPaise)
  const retained = formatPaise(opts.retainedPaise)

  const subject = `Your ${opts.batchName} slot has been released`

  const text = `Hi ${firstName},

Your approved slot for ${opts.batchName} was held for 48 hours to complete payment, but we didn't receive the remaining balance in time — so the slot has now been released to the next person on the waitlist.

As per our policy, ${opts.forfeitPercent}% of your booking amount (${retained}) is retained and the remaining ${refund} will be refunded to your original payment method within 5–7 business days.

If you'd still like to join a future departure, reply to this email or reach us at hello@togetha.club and we'll help you re-book.

— Togetha.Club
hello@togetha.club`

  const html = emailShell(`
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8a3324;">Slot released</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.3;">Hi ${firstName}, your ${opts.batchName} slot was released</h1>
    <p style="margin:0 0 16px;line-height:1.6;">Your approved slot was held for 48 hours to complete payment, but we didn't receive the remaining balance in time — so it has been released to the next person on the waitlist.</p>
    <div style="margin:20px 0;padding:16px 18px;background:#f5edd8;border:1px dashed #2c1810;border-radius:4px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.7;">
      <p style="margin:0 0 6px;"><strong>Retained (${opts.forfeitPercent}%):</strong> ${retained}</p>
      <p style="margin:0;font-size:16px;"><strong>Refund to you:</strong> ${refund}</p>
    </div>
    <p style="margin:0;line-height:1.6;">The refund goes to your original payment method within 5–7 business days. Want to join a future departure? Reply to this email and we'll help you re-book.</p>
  `)

  return { subject, text, html }
}

export function buildBalancePaymentReminder(opts: {
  name: string
  batchName: string
  balanceDuePaise: number
  amountPaidPaise: number
  finalAmountPaise: number | null
  originalAmountPaise?: number | null
  discountAmountPaise?: number | null
  departureLabel?: string | null
  siteUrl?: string
}) {
  const payUrl = memberBalancePayUrl(opts.siteUrl)
  return renderBalancePaymentReminderEmail({ ...opts, payUrl })
}
