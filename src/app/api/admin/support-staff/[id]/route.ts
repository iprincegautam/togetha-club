import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { updateSupportStaff } from '@/lib/support-account'
import { isSupportPermission, type SupportViewScope } from '@/lib/support/permissions'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const input: Parameters<typeof updateSupportStaff>[2] = {
    grantedBy: auth.profile?.id ?? auth.session.user.id,
  }

  if (body.viewScope !== undefined) {
    input.viewScope = body.viewScope === 'all' ? 'all' : 'assigned_only'
  }
  if (body.fullName !== undefined) {
    input.fullName = String(body.fullName)
  }
  if (body.isActive !== undefined) {
    input.isActive = Boolean(body.isActive)
  }
  if (Array.isArray(body.permissions)) {
    input.permissions = body.permissions.filter(isSupportPermission)
  }

  const result = await updateSupportStaff(auth.service, id, input)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
