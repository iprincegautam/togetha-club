import { NextResponse } from 'next/server'
import { approveApplicantProfile } from '@/lib/applicant-ops/approve-profile'
import { assertApplicantInSupportScope } from '@/lib/support/applicant-scope'
import { requireSupportApiAccess } from '@/lib/auth/support'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireSupportApiAccess('applicants.approve_profile')
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

  const result = await approveApplicantProfile(auth.service, id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    ok: true,
    applicant: result.applicant,
    profileComplete: result.profileComplete,
  })
}
