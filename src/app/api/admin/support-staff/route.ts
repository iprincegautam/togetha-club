import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { listSupportStaff, provisionSupportAccount } from '@/lib/support-account'
import { isSupportPermission, DEFAULT_SUPPORT_VIEW_SCOPE, type SupportViewScope } from '@/lib/support/permissions'

export async function GET() {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const staff = await listSupportStaff(auth.service)
    return NextResponse.json({ staff })
  } catch (err) {
    console.error('[GET support-staff]', err)
    return NextResponse.json({ error: 'Could not load support staff' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json().catch(() => ({}))
  const email = String(body.email ?? '').trim()
  const fullName = String(body.fullName ?? body.name ?? '').trim()
  const viewScope = (body.viewScope ?? DEFAULT_SUPPORT_VIEW_SCOPE) as SupportViewScope
  const permissions = Array.isArray(body.permissions)
    ? body.permissions.filter(isSupportPermission)
    : undefined

  const result = await provisionSupportAccount(auth.service, {
    email,
    fullName,
    viewScope: viewScope === 'all' ? 'all' : 'assigned_only',
    permissions,
    grantedBy: auth.profile?.id ?? auth.session.user.id,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    profileId: result.profileId,
    email: result.email,
    temporaryPassword: result.temporaryPassword,
    isNewUser: result.isNewUser,
  })
}
