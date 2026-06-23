import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { canAdminApproveProfile } from '@/lib/applicant-kyc'
import { isProfileComplete } from '@/lib/payment-claim'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  const { data: applicant, error: fetchError } = await auth.service
    .from('applicants')
    .select(
      'id, email, name, status, kyc_status, quiz_answers, batch_slug, gender, profile_completed_at'
    )
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error('[POST approve-profile]', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!applicant) {
    return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
  }

  const gate = canAdminApproveProfile(applicant)
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('applicants')
    .update({ kyc_status: 'approved' })
    .eq('id', id)
    .select('id, email, kyc_status, status')
    .single()

  if (error) {
    console.error('[POST approve-profile update]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    applicant: data,
    profileComplete: isProfileComplete(applicant),
  })
}
