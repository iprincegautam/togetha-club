import { NextRequest, NextResponse } from 'next/server'
import { adminProvisionMemberLogin } from '@/lib/member-account'
import { requireSupportApiAccess } from '@/lib/auth/support'
import { isValidIndianPhone, normalizeIndianPhone } from '@/lib/phone'

export async function POST(req: NextRequest) {
  const auth = await requireSupportApiAccess('applicants.provision_login')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json().catch(() => ({}))
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const phoneRaw = String(body.phone ?? '').trim()

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }
  if (!isValidIndianPhone(phoneRaw)) {
    return NextResponse.json({ error: 'Valid 10-digit Indian mobile required' }, { status: 400 })
  }

  const result = await adminProvisionMemberLogin(auth.service, {
    name,
    email,
    phone: normalizeIndianPhone(phoneRaw),
    assignedSupportId: auth.profile.id,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    applicantId: result.applicantId,
    email: result.email,
    temporaryPassword: result.temporaryPassword,
    isNewUser: result.isNewUser,
  })
}
