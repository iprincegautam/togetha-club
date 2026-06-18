import { NextResponse } from 'next/server'
import { fetchAdminApplicants } from '@/lib/admin-applicants'
import { requireAdminApiAccess } from '@/lib/auth/admin'

export async function GET() {
  try {
    const auth = await requireAdminApiAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const applicants = await fetchAdminApplicants(auth.service)

    return NextResponse.json({ applicants })
  } catch (err) {
    console.error('[GET /api/admin/applicants]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
