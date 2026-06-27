import { NextResponse } from 'next/server'
import { approveApplicantProfile } from '@/lib/applicant-ops/approve-profile'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
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
