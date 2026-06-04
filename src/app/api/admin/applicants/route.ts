import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { mapApplicantRow } from '@/lib/applicants'

export async function GET() {
  try {
    const auth = await requireAdminApiAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const fullSelect = `
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

    let { data, error } = await auth.service
      .from('applicants')
      .select(fullSelect)
      .order('created_at', { ascending: false })

    if (error) {
      const fallback = await auth.service
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
          batches ( name, slug )
        `
        )
        .order('created_at', { ascending: false })
      data = fallback.data
      error = fallback.error
    }

    if (error) throw error

    const applicants = (data ?? []).map((row) =>
      mapApplicantRow({
        ...row,
        priority_review: 'priority_review' in row ? row.priority_review : false,
        promo_codes: 'promo_codes' in row ? row.promo_codes : null,
      })
    )

    return NextResponse.json({ applicants })
  } catch (err) {
    console.error('[GET /api/admin/applicants]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
