import { NextResponse } from 'next/server'
import { verifyEmailOtp, type OtpPortal } from '@/lib/auth/otp'
import { completeMemberSignup, completePartnerSignup } from '@/lib/auth/signup'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

function parsePortal(value: unknown): OtpPortal | null {
  return value === 'member' || value === 'partner' ? value : null
}

export async function POST(request: Request) {
  const service = tryCreateServiceRoleClient()
  if (!service) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const body = await request.json()
  const portal = parsePortal(body.portal)
  const email = String(body.email ?? '').trim()
  const code = String(body.code ?? '').trim()
  const password = String(body.password ?? '')

  if (!portal || !email.includes('@') || !code) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const verified = await verifyEmailOtp(service, {
    email,
    code,
    purpose: 'signup',
    portal,
  })

  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 })
  }

  const name =
    body.name != null
      ? String(body.name).trim()
      : (verified.metadata.name as string | undefined)

  const result =
    portal === 'member'
      ? await completeMemberSignup(service, { email, password, name })
      : await completePartnerSignup(service, { email, password })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ ok: true, portal })
}
