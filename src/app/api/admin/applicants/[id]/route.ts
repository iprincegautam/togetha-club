import { NextResponse } from 'next/server'
import { buildApplicantMatchInsight } from '@/lib/match-analysis'
import { patchApplicant } from '@/lib/applicant-ops/patch-applicant'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { buildApplicantMatchInsightResponse } from '@/lib/applicant-ops/get-applicant-detail'
import { hasQuizAnswers, normalizeQuizAnswers } from '@/lib/quiz-normalize'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const { data, error } = await auth.service
    .from('applicants')
    .select(
      `
      *,
      batches ( name, slug ),
      promo_codes ( code ),
      batch_departures ( label, sublabel )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[GET applicant]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

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
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json()

  const result = await patchApplicant(auth.service, id, {
    status: body.status,
    adminNotes: body.adminNotes,
    assignedSupportId: body.assignedSupportId,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ applicant: result.applicant })
}
