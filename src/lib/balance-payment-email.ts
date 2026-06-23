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
  departureLabel?: string | null
  payUrl: string
}): { subject: string; text: string; html: string } {
  const firstName = opts.name.split(/\s+/)[0] || opts.name
  const balance = formatPaise(opts.balanceDuePaise)
  const paidSoFar = formatPaise(opts.amountPaidPaise)
  const total =
    opts.finalAmountPaise != null ? formatPaise(opts.finalAmountPaise) : null
  const departureLine = opts.departureLabel
    ? `Your departure: ${opts.departureLabel}.`
    : 'Your Himalayan departure is coming up.'

  const subject = `✦ Complete your trip payment — ${balance} due before departure`

  const text = `Hi ${firstName},

Thank you for reserving your spot on ${opts.batchName}. ${departureLine}

You've paid ${paidSoFar} so far${total ? ` toward ${total}` : ''}. The remaining balance is ${balance}, due before your trip.

Pay securely on your member portal (same email you booked with):
${opts.payUrl}

After you log in, scroll to "Pay remaining balance" — Razorpay checkout takes under a minute.

If you've already paid, ignore this — we'll reconcile within 24 hours.

See you in the mountains,
Togetha.Club
hello@togetha.club`

  const html = emailShell(`
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#1a6b5a;">✦ Balance due ✦</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.3;">Hi ${firstName}, complete your trip payment</h1>
    <p style="margin:0 0 16px;line-height:1.6;">Thank you for reserving your spot on <strong>${opts.batchName}</strong>. ${departureLine}</p>
    <div style="margin:20px 0;padding:16px 18px;background:#f5edd8;border:1px dashed #2c1810;border-radius:4px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.7;">
      <p style="margin:0 0 6px;"><strong>Paid so far:</strong> ${paidSoFar}${total ? ` of ${total}` : ''}</p>
      <p style="margin:0;font-size:16px;"><strong>Balance due now:</strong> ${balance}</p>
    </div>
    <p style="margin:0;line-height:1.6;">Log in with your booking email, then use <strong>Pay remaining balance</strong> on your dashboard. Same secure Razorpay checkout as when you booked your slot.</p>
    ${ctaButton(opts.payUrl, `Pay ${balance} →`)}
    <p style="margin:20px 0 0;font-size:13px;color:#6b5344;line-height:1.5;">Already paid? Ignore this — we'll update your booking within 24 hours.</p>
  `)

  return { subject, text, html }
}

export function buildBalancePaymentReminder(opts: {
  name: string
  batchName: string
  balanceDuePaise: number
  amountPaidPaise: number
  finalAmountPaise: number | null
  departureLabel?: string | null
  siteUrl?: string
}) {
  const payUrl = memberBalancePayUrl(opts.siteUrl)
  return renderBalancePaymentReminderEmail({ ...opts, payUrl })
}
