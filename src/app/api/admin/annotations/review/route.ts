import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type ReviewBody = {
  action: 'approve' | 'reject' | 'send_back'
  reason?: string
}

export async function POST(request: Request) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = (await request.json()) as ReviewBody & { id?: string }
  const { id, action, reason } = body

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action are required' }, { status: 400 })
  }

  const { data: existing, error: fetchError } = await auth.service
    .from('dm_annotations')
    .select('annotation_status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
  }
  if (existing.annotation_status !== 'submitted') {
    return NextResponse.json({ error: 'Only submitted annotations can be reviewed' }, { status: 400 })
  }

  const now = new Date().toISOString()

  if (action === 'approve') {
    const { data, error } = await auth.service
      .from('dm_annotations')
      .update({
        annotation_status: 'reviewed',
        reviewed_at: now,
        rejection_reason: null,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ annotation: data })
  }

  if (!reason?.trim()) {
    return NextResponse.json({ error: 'A reason is required for reject or send back' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('dm_annotations')
    .update({
      annotation_status: 'draft',
      rejection_reason: reason.trim(),
      submitted_at: null,
      reviewed_at: null,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ annotation: data })
}
