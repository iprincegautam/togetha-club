import { NextResponse } from 'next/server'
import type { InternApplicationStatus } from '@/content/careers/types'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type RouteContext = { params: Promise<{ id: string }> }

const VALID_STATUSES: InternApplicationStatus[] = [
  'applied',
  'assignment_sent',
  'reviewed',
  'shortlisted',
  'rejected',
]

const SELECT_FIELDS =
  'id, full_name, email, phone, college, course, year_of_study, track, portfolio_url, why_togetha, resume_storage_path, status, assignment_sent_at, notes, created_at'

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params

  const { data, error } = await auth.service
    .from('intern_applications')
    .select(SELECT_FIELDS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[GET /api/admin/interns/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ application: data })
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params
  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = body.status
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes ? String(body.notes) : null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('intern_applications')
    .update(updates)
    .eq('id', id)
    .select(SELECT_FIELDS)
    .single()

  if (error) {
    console.error('[PATCH /api/admin/interns/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ application: data })
}
