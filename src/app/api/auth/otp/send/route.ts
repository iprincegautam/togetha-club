import { NextResponse } from 'next/server'
import { sendEmailOtp, type OtpPortal, type OtpPurpose } from '@/lib/auth/otp'
import {
  assertPartnerEligible,
  assertResetEligible,
  validatePassword,
} from '@/lib/auth/signup'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'
import { isResendConfigured } from '@/lib/resend'

function parsePortal(value: unknown): OtpPortal | null {
  return value === 'member' || value === 'partner' ? value : null
}

function parsePurpose(value: unknown): OtpPurpose | null {
  return value === 'signup' || value === 'reset_password' ? value : null
}

export async function POST(request: Request) {
  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: 'Email service is not configured. Contact support.' },
      { status: 503 }
    )
  }

  const service = tryCreateServiceRoleClient()
  if (!service) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const body = await request.json()
  const portal = parsePortal(body.portal)
  const purpose = parsePurpose(body.purpose)
  const email = String(body.email ?? '').trim()

  if (!portal || !purpose || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (purpose === 'signup') {
    const password = String(body.password ?? '')
    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    if (portal === 'partner') {
      const eligible = await assertPartnerEligible(service, email)
      if (!eligible.ok) {
        return NextResponse.json({ error: eligible.error }, { status: 403 })
      }
    }
  }

  if (purpose === 'reset_password') {
    await assertResetEligible(service, email, portal)
    // Always respond generically below to avoid email enumeration
  }

  const result = await sendEmailOtp(service, {
    email,
    purpose,
    portal,
    metadata: {
      name: body.name ? String(body.name).trim() : undefined,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    ok: true,
    message: 'Verification code sent. Check your email.',
  })
}
