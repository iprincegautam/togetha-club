import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params

  const { data: row, error: fetchError } = await auth.service
    .from('intern_applications')
    .select('resume_storage_path, full_name')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error('[GET /api/admin/interns/[id]/resume]', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!row?.resume_storage_path) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
  }

  const { data: signed, error: signError } = await auth.service.storage
    .from('intern-resumes')
    .createSignedUrl(row.resume_storage_path, 3600)

  if (signError || !signed?.signedUrl) {
    console.error('[GET /api/admin/interns/[id]/resume] sign', signError?.message)
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl, fullName: row.full_name })
}
