import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { enrollQuizNurture } from '@/lib/nurture/send'

/** Manually enroll + send nurture Email 1 (e.g. backfill after migration). */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const applicantId = String(body.applicantId ?? '').trim()

    if (!email && !applicantId) {
      return NextResponse.json({ error: 'email or applicantId required' }, { status: 400 })
    }

    let id = applicantId
    if (!id && email) {
      const { data, error } = await auth.service
        .from('applicants')
        .select('id')
        .eq('email', email)
        .maybeSingle()
      if (error) throw error
      if (!data?.id) {
        return NextResponse.json({ error: 'Applicant not found for email' }, { status: 404 })
      }
      id = data.id
    }

    const result = await enrollQuizNurture(auth.service, id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'enroll_failed' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, applicantId: id })
  } catch (err) {
    console.error('[POST /api/admin/nurture/enroll]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
