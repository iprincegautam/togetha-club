import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

export async function GET() {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await auth.service
    .from('dm_annotations')
    .select('*')
    .order('message_id', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ annotations: data ?? [] })
}
