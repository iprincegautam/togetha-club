import { createHash, randomInt } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendOtpEmail } from '@/lib/resend'

export type OtpPortal = 'member' | 'partner'
export type OtpPurpose = 'signup' | 'reset_password'

const OTP_TTL_MS = 10 * 60 * 1000
const OTP_COOLDOWN_MS = 60 * 1000
const OTP_MAX_PER_WINDOW = 5
const OTP_WINDOW_MS = 15 * 60 * 1000

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashCode(email: string, code: string): string {
  const pepper = process.env.OTP_PEPPER || 'togetha-otp'
  return createHash('sha256').update(`${pepper}:${normalizeEmail(email)}:${code}`).digest('hex')
}

function generateCode(): string {
  return String(randomInt(100000, 999999))
}

export async function sendEmailOtp(
  service: SupabaseClient,
  input: {
    email: string
    purpose: OtpPurpose
    portal: OtpPortal
    metadata?: Record<string, unknown>
  }
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const email = normalizeEmail(input.email)
  if (!email.includes('@')) {
    return { ok: false, error: 'Invalid email', status: 400 }
  }

  const since = new Date(Date.now() - OTP_WINDOW_MS).toISOString()
  const { count, error: countError } = await service
    .from('email_otp_codes')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .eq('purpose', input.purpose)
    .eq('portal', input.portal)
    .gte('created_at', since)

  if (countError) {
    console.error('[sendEmailOtp] count', countError.message)
    return { ok: false, error: 'Could not send code', status: 500 }
  }

  if ((count ?? 0) >= OTP_MAX_PER_WINDOW) {
    return { ok: false, error: 'Too many codes sent. Try again in a few minutes.', status: 429 }
  }

  const { data: recent } = await service
    .from('email_otp_codes')
    .select('created_at')
    .eq('email', email)
    .eq('purpose', input.purpose)
    .eq('portal', input.portal)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recent?.created_at) {
    const elapsed = Date.now() - new Date(recent.created_at).getTime()
    if (elapsed < OTP_COOLDOWN_MS) {
      return { ok: false, error: 'Please wait a minute before requesting another code.', status: 429 }
    }
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString()

  const { error: insertError } = await service.from('email_otp_codes').insert({
    email,
    code_hash: hashCode(email, code),
    purpose: input.purpose,
    portal: input.portal,
    metadata: input.metadata ?? {},
    expires_at: expiresAt,
  })

  if (insertError) {
    console.error('[sendEmailOtp] insert', insertError.message)
    return { ok: false, error: 'Could not send code', status: 500 }
  }

  const portalLabel = input.portal === 'member' ? 'Member' : 'Partner'
  const purposeLabel = input.purpose === 'signup' ? 'account setup' : 'password reset'

  await sendOtpEmail({
    to: email,
    code,
    portalLabel,
    purposeLabel,
  })

  return { ok: true }
}

export async function verifyEmailOtp(
  service: SupabaseClient,
  input: {
    email: string
    code: string
    purpose: OtpPurpose
    portal: OtpPortal
  }
): Promise<{ ok: true; metadata: Record<string, unknown> } | { ok: false; error: string }> {
  const email = normalizeEmail(input.email)
  const trimmed = input.code.trim()
  if (!/^\d{6}$/.test(trimmed)) {
    return { ok: false, error: 'Enter the 6-digit code from your email.' }
  }

  const { data: row, error } = await service
    .from('email_otp_codes')
    .select('id, code_hash, expires_at, consumed_at, metadata')
    .eq('email', email)
    .eq('purpose', input.purpose)
    .eq('portal', input.portal)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !row) {
    return { ok: false, error: 'Invalid or expired code.' }
  }

  if (row.consumed_at || new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'Code expired. Request a new one.' }
  }

  if (row.code_hash !== hashCode(email, trimmed)) {
    return { ok: false, error: 'Invalid code.' }
  }

  await service
    .from('email_otp_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id)

  return { ok: true, metadata: (row.metadata as Record<string, unknown>) ?? {} }
}
