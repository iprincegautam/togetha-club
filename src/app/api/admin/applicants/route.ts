import { NextResponse } from 'next/server'
import { mapApplicantRow } from '@/lib/applicants'
import { getAdminSession } from '@/lib/supabase/server'

export async function GET() {
  try {
    const { supabase, session } = await getAdminSession()

    if (!supabase || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
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

    if (error) throw error

    const applicants = (data ?? []).map(mapApplicantRow)

    return NextResponse.json({ applicants })
  } catch (err) {
    console.error('[GET /api/admin/applicants]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
