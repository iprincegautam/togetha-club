import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import type { FailureReason } from '@/lib/annotations/types'

type PatchBody = {
  failure_reason?: FailureReason | null
  winning_response?: string | null
  tone_score_losing?: number | null
  conversion_score_winning?: number | null
  annotator_notes?: string | null
  is_flagged?: boolean
  annotator_name?: string | null
  annotation_status?: 'draft' | 'submitted'
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = (await request.json()) as PatchBody

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
  if (existing.annotation_status !== 'draft') {
    if (body.annotation_status === 'submitted') {
      return NextResponse.json({ error: 'Annotation is already locked' }, { status: 400 })
    }
    if (body.annotation_status === 'draft') {
      return NextResponse.json({ error: 'Cannot edit a locked annotation' }, { status: 400 })
    }
  }

  const now = new Date().toISOString()
  const annotatorName =
    body.annotator_name ??
    auth.profile?.full_name ??
    auth.session.user.email ??
    'unknown'

  const update: Record<string, unknown> = {
    failure_reason: body.failure_reason ?? null,
    winning_response: body.winning_response ?? null,
    tone_score_losing: body.tone_score_losing ?? null,
    conversion_score_winning: body.conversion_score_winning ?? null,
    annotator_notes: body.annotator_notes ?? null,
    is_flagged: body.is_flagged ?? false,
    annotator_name: annotatorName,
  }

  if (body.annotation_status === 'submitted') {
    update.annotation_status = 'submitted'
    update.submitted_at = now
    update.rejection_reason = null
  }

  const { data, error } = await auth.service
    .from('dm_annotations')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ annotation: data })
}
