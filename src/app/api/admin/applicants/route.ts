import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { mapApplicantRow, type ApplicantDbRow } from '@/lib/applicants'

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
        phone,
        gender,
        batch_slug,
        quiz_score,
        status,
        created_at,
        priority_review,
        batches ( name, slug ),
        promo_codes ( code )
      `

    const full = await auth.service
      .from('applicants')
      .select(fullSelect)
      .order('created_at', { ascending: false })

    let rows: ApplicantDbRow[] | null = (full.data ?? null) as ApplicantDbRow[] | null
    let fetchError = full.error

    if (fetchError) {
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
      rows = (fallback.data ?? null) as ApplicantDbRow[] | null
      fetchError = fallback.error
    }

    if (fetchError) throw fetchError

    const applicants = (rows ?? []).map((row) => mapApplicantRow(row))

    return NextResponse.json({ applicants })
  } catch (err) {
    console.error('[GET /api/admin/applicants]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
