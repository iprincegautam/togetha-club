import { NextResponse } from 'next/server'
import { buildApplicantMatchInsight } from '@/lib/match-analysis'
import { buildApplicantMatchInsightResponse } from '@/lib/applicant-ops/get-applicant-detail'
import { getSupportApplicantById } from '@/lib/applicant-ops/fetch-applicants'
import { patchApplicant } from '@/lib/applicant-ops/patch-applicant'
import { assertApplicantInSupportScope } from '@/lib/support/applicant-scope'
import { requireSupportApiAccess } from '@/lib/auth/support'
import { hasPermission } from '@/lib/support/permissions'
import { hasQuizAnswers, normalizeQuizAnswers } from '@/lib/quiz-normalize'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireSupportApiAccess('applicants.view')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const scope = await assertApplicantInSupportScope(
    auth.service,
    id,
    auth.staff.view_scope,
    auth.profile.id
  )
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status })
  }

  const data = await getSupportApplicantById(
    auth.service,
    id,
    auth.staff.view_scope,
    auth.profile.id
  )

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let matchInsight = data.match_insight ?? null
  if (!matchInsight && hasQuizAnswers(data.quiz_answers) && data.batch_slug) {
    const { match } = await buildApplicantMatchInsight(
      auth.service,
      normalizeQuizAnswers(data.quiz_answers),
      data.batch_slug
    )
    matchInsight = buildApplicantMatchInsightResponse(match)
  }

  return NextResponse.json({ applicant: data, matchInsight })
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireSupportApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const scope = await assertApplicantInSupportScope(
    auth.service,
    id,
    auth.staff.view_scope,
    auth.profile.id
  )
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status })
  }

  const body = await request.json()
  const patch: Parameters<typeof patchApplicant>[2] = {}

  if (body.status !== undefined) {
    if (!hasPermission(auth.permissions, 'applicants.status')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }
    patch.status = body.status
  }

  if (body.adminNotes !== undefined) {
    if (!hasPermission(auth.permissions, 'applicants.notes')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }
    patch.adminNotes = body.adminNotes
  }

  const result = await patchApplicant(auth.service, id, patch)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ applicant: result.applicant })
}
