import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { buildApplicantMatchInsight } from '@/lib/match-analysis'
import { ensureMemberAccountForApplicant } from '@/lib/member-account'
import { hasQuizAnswers, normalizeQuizAnswers } from '@/lib/quiz-normalize'
import type { ApplicantStatus } from '@/types/applicant'

type RouteParams = { params: Promise<{ id: string }> }

const VALID_STATUSES: ApplicantStatus[] = [
  'pending',
  'approved',
  'rejected',
  'paid',
  'deposit_paid',
]

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
    if (match) {
      matchInsight = {
        matchScore: match.matchScore,
        placementChance: match.placementChance,
        cohortMatchPercent: match.cohortMatchPercent,
        cohortStrongMatchPercent: match.cohortStrongMatchPercent,
        cohortSampleSize: match.cohortSampleSize,
        aiNarrative: match.aiNarrative,
        peerMix: match.peerMix,
        confidence: match.confidence,
      }
    }
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
  const updates: Record<string, unknown> = {}

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = body.status
  }

  if (body.adminNotes !== undefined) {
    updates.admin_notes = body.adminNotes ? String(body.adminNotes) : null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('applicants')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[PATCH applicant]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (
    data.email &&
    (data.status === 'paid' || data.status === 'deposit_paid') &&
    (data.razorpay_payment_id || updates.status)
  ) {
    await ensureMemberAccountForApplicant(auth.service, {
      applicantId: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
    })
  }

  return NextResponse.json({ applicant: data })
}
