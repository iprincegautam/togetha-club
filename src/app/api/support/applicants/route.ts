import { NextResponse } from 'next/server'
import { fetchSupportApplicants } from '@/lib/applicant-ops/fetch-applicants'
import { requireSupportApiAccess } from '@/lib/auth/support'

export async function GET() {
  const auth = await requireSupportApiAccess('applicants.view')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const applicants = await fetchSupportApplicants(
      auth.service,
      auth.staff.view_scope,
      auth.profile.id
    )
    return NextResponse.json({ applicants })
  } catch (err) {
    console.error('[GET support applicants]', err)
    return NextResponse.json({ error: 'Could not load applicants' }, { status: 500 })
  }
}
