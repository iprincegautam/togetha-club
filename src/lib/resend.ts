import { Resend } from 'resend'

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
  temporaryPassword?: string
  existingAccount?: boolean
}) {
  if (!isResendConfigured() || !resend) return null

  const text = opts.existingAccount
    ? `Hi ${opts.name},\n\nYour Togetha.Club payment is confirmed and linked to your account.\n\nLog in to track your booking and complete your profile:\n${opts.loginUrl}\n\nUse the password you already set. Forgot it? Use "Forgot password" on the login page.\n\n— Togetha.Club`
    : `Hi ${opts.name},\n\nYour Togetha.Club spot is confirmed. We created your member account so you can track your booking anytime.\n\nLog in here:\n${opts.loginUrl}\n\nEmail: ${opts.to}\nTemporary password: ${opts.temporaryPassword}\n\nYou can change your password anytime under Account → Forgot password.\n\n— Togetha.Club`

  return resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to: opts.to,
    subject: `✦ Your Togetha.Club member login`,
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
