import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

export async function GET() {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await auth.service
    .from('waitlist')
    .select('id, email, gender, batch_slug, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/admin/waitlist]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ waitlist: data ?? [] })
}
