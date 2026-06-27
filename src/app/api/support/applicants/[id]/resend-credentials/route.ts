import { NextResponse } from 'next/server'
import { resendMemberCredentials } from '@/lib/member-account'
import { assertApplicantInSupportScope } from '@/lib/support/applicant-scope'
import { requireSupportApiAccess } from '@/lib/auth/support'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireSupportApiAccess('applicants.resend_credentials')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const scope = await assertApplicantInSupportScope(
    auth.service,
    id,
    auth.staff.view_scope,
    auth.profile.id
  )
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status })
  }

  const result = await resendMemberCredentials(auth.service, id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    email: result.email,
    isNewUser: result.isNewUser,
    temporaryPassword: result.temporaryPassword,
  })
}
