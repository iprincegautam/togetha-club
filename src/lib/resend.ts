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
    ? `Hi ${opts.name},\n\nYour Togetha.Club payment is confirmed and linked to your account.\n\nLog in to track your booking and complete your profile:\n${opts.loginUrl}\n\nUse the password you already set. Forgot it? Use "Reset password" on the login page.\n\n— Togetha.Club`
    : `Hi ${opts.name},\n\nYour Togetha.Club spot is confirmed. We created your member account so you can track your booking anytime.\n\nLog in here:\n${opts.loginUrl}\n\nEmail: ${opts.to}\nTemporary password: ${opts.temporaryPassword}\n\nPlease change your password after your first login.\n\n— Togetha.Club`

  return resend.emails.send({
    from: 'Togetha.Club <hello@togetha.club>',
    to: opts.to,
    subject: `✦ Your Togetha.Club member login`,
    text,
  })
}
