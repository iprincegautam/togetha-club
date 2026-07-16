import { Resend } from 'resend'
import { renderMemberWelcomeEmail } from '@/lib/member-welcome-email'
import { buildBalancePaymentReminder, renderSlotReleasedEmail } from '@/lib/balance-payment-email'

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : (null as unknown as Resend)

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendConfirmationEmail(to: string, name: string, batchName: string) {
  if (!isResendConfigured() || !resend) return null
  return resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to,
    subject: `✦ You're confirmed for ${batchName}`,
    text: `Hi ${name},\n\nYour spot is confirmed for ${batchName}.\nWe'll be in touch within 48 hours with everything you need.\n\n— Togetha.Club`,
  })
}

export async function sendWaitlistEmail(to: string) {
  if (!isResendConfigured() || !resend) return null
  return resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to,
    subject: `✦ You're on the Togetha.Club waitlist`,
    text: `You'll get 48-hour early access when Batch C drops on August 1st.\n\n— Togetha.Club`,
  })
}

export async function sendMemberWelcomeEmail(opts: {
  to: string
  name: string
  loginUrl: string
  settingsUrl?: string
  temporaryPassword?: string
  existingAccount?: boolean
}) {
  if (!isResendConfigured() || !resend) return null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'
  const { subject, text, html } = renderMemberWelcomeEmail({
    name: opts.name,
    email: opts.to,
    loginUrl: opts.loginUrl,
    settingsUrl: opts.settingsUrl ?? `${siteUrl}/account/settings`,
    temporaryPassword: opts.temporaryPassword,
    existingAccount: opts.existingAccount,
  })

  return resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to: opts.to,
    subject,
    text,
    html,
  })
}

export async function sendBalancePaymentReminderEmail(opts: {
  to: string
  name: string
  batchName: string
  balanceDuePaise: number
  amountPaidPaise: number
  finalAmountPaise: number | null
  originalAmountPaise?: number | null
  discountAmountPaise?: number | null
  departureLabel?: string | null
}) {
  if (!isResendConfigured() || !resend) {
    return { ok: false as const, error: 'Email service is not configured.' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'
  const { subject, text, html } = buildBalancePaymentReminder({
    ...opts,
    siteUrl,
  })

  const result = await resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to: opts.to,
    subject,
    text,
    html,
  })

  if (result.error) {
    console.error('[sendBalancePaymentReminderEmail]', result.error)
    return { ok: false as const, error: result.error.message }
  }

  return { ok: true as const, payUrl: `${siteUrl.replace(/\/$/, '')}/account/login?next=${encodeURIComponent('/account')}` }
}

export async function sendSlotReleasedEmail(opts: {
  to: string
  name: string
  batchName: string
  amountPaidPaise: number
  refundPaise: number
  retainedPaise: number
  forfeitPercent: number
}) {
  if (!isResendConfigured() || !resend) {
    return { ok: false as const, error: 'Email service is not configured.' }
  }

  const { subject, text, html } = renderSlotReleasedEmail({
    name: opts.name,
    batchName: opts.batchName,
    amountPaidPaise: opts.amountPaidPaise,
    refundPaise: opts.refundPaise,
    retainedPaise: opts.retainedPaise,
    forfeitPercent: opts.forfeitPercent,
  })

  const result = await resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to: opts.to,
    subject,
    text,
    html,
  })

  if (result.error) {
    console.error('[sendSlotReleasedEmail]', result.error)
    return { ok: false as const, error: result.error.message }
  }

  return { ok: true as const }
}

export async function sendSupportWelcomeEmail(opts: {
  to: string
  name: string
  loginUrl: string
  temporaryPassword: string
}) {
  if (!isResendConfigured() || !resend) return null

  const text = `Hi ${opts.name},\n\nYour Togetha.Club support portal is ready.\n\nLog in: ${opts.loginUrl}\nEmail: ${opts.to}\nTemporary password: ${opts.temporaryPassword}\n\nChange your password after first login.\n\nUse the portal to guide applicants through booking — view leads, provision logins, and send payment links.\n\n— Togetha.Club`

  return resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to: opts.to,
    subject: `✦ Your Togetha.Club support portal`,
    text,
  })
}

export async function sendPartnerWelcomeEmail(opts: {
  to: string
  name: string
  loginUrl: string
  signupUrl: string
  temporaryPassword?: string
  existingAccount?: boolean
}) {
  if (!isResendConfigured() || !resend) return null

  const text = opts.existingAccount
    ? `Hi ${opts.name},\n\nYour Togetha.Club partner portal is ready.\n\nLog in: ${opts.loginUrl}\n\nUse your existing password, or reset it from the login page.\n\n— Togetha.Club`
    : opts.temporaryPassword
      ? `Hi ${opts.name},\n\nWelcome to the Togetha.Club partner program.\n\nLog in: ${opts.loginUrl}\nEmail: ${opts.to}\nTemporary password: ${opts.temporaryPassword}\n\nChange your password after first login, or create your own at:\n${opts.signupUrl}\n\n— Togetha.Club`
      : `Hi ${opts.name},\n\nYou've been added as a Togetha.Club partner.\n\nCreate your login (email OTP verification):\n${opts.signupUrl}\n\nThen track promo codes and earnings at:\n${opts.loginUrl}\n\n— Togetha.Club`

  return resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to: opts.to,
    subject: `✦ Your Togetha.Club partner portal`,
    text,
  })
}

export async function sendOtpEmail(opts: {
  to: string
  code: string
  portalLabel: string
  purposeLabel: string
}) {
  if (!isResendConfigured() || !resend) {
    console.warn('[sendOtpEmail] RESEND_API_KEY not configured — OTP not emailed')
    return null
  }

  return resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to: opts.to,
    subject: `✦ ${opts.code} — your Togetha.Club verification code`,
    text: `Your ${opts.portalLabel} portal verification code for ${opts.purposeLabel}:\n\n${opts.code}\n\nThis code expires in 10 minutes. If you didn't request this, ignore this email.\n\n— Togetha.Club`,
  })
}
