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
