import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

export async function GET() {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await auth.service
    .from('intern_applications')
    .select(
      'id, full_name, email, phone, college, course, year_of_study, track, portfolio_url, why_togetha, resume_storage_path, status, assignment_sent_at, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/admin/interns]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ applications: data ?? [] })
}
