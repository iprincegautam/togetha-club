import { NextResponse } from 'next/server'
import { requireSupportApiAccess } from '@/lib/auth/support'

export async function GET() {
  const auth = await requireSupportApiAccess('waitlist.view')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await auth.service
    .from('waitlist')
    .select('id, email, gender, batch_slug, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/support/waitlist]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ waitlist: data ?? [] })
}
