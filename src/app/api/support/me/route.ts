import { NextResponse } from 'next/server'
import { requireSupportApiAccess } from '@/lib/auth/support'
import { SUPPORT_PERMISSION_LABELS } from '@/lib/support/permissions'

export async function GET() {
  const auth = await requireSupportApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  return NextResponse.json({
    profile: {
      id: auth.profile.id,
      email: auth.profile.email,
      fullName: auth.profile.full_name,
      passwordChangeRequired: auth.profile.password_change_required ?? false,
    },
    staff: auth.staff,
    permissions: Array.from(auth.permissions),
    permissionLabels: SUPPORT_PERMISSION_LABELS,
  })
}
