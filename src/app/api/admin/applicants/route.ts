import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { mapApplicantRow } from '@/lib/applicants'

export async function GET() {
  try {
    const auth = await requireAdminApiAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { data, error } = await auth.service
      .from('applicants')
      .select(
        `
        id,
        name,
        email,
        gender,
        batch_slug,
        quiz_score,
        status,
        created_at,
        priority_review,
        batches ( name, slug ),
        promo_codes ( code )
      `
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    const applicants = (data ?? []).map(mapApplicantRow)

    return NextResponse.json({ applicants })
  } catch (err) {
    console.error('[GET /api/admin/applicants]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
