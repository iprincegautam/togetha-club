import { NextRequest, NextResponse } from 'next/server'
import { requireMemberApiAccess } from '@/lib/auth/member'
import { hasVerifiedPayment } from '@/lib/applicant-payment'
import { resolveDepartureForPersist } from '@/lib/applicant-departure'
import { buildApplicantMatchInsight } from '@/lib/match-analysis'
import { answersToCompatibilityVector } from '@/lib/match-engine'
import { hasQuizAnswers, normalizeQuizAnswers } from '@/lib/quiz-normalize'
import type { QuizAnswers } from '@/types/quiz'

const VALID_SLUGS = ['batch-a', 'batch-b', 'batch-d', 'batch-e'] as const

export async function POST(req: NextRequest) {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!hasVerifiedPayment(auth.applicant)) {
    return NextResponse.json(
      { error: 'Link your Razorpay payment before completing your profile.' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const answers = body.answers as QuizAnswers
  const score = body.score
  const batchSlug = String(body.batchSlug ?? '').trim()
  const gender = body.gender === 'm' || body.gender === 'f' ? body.gender : null
  const dateChoice =
    body.dateChoice !== undefined && body.dateChoice !== null && body.dateChoice !== ''
      ? String(body.dateChoice)
      : null

  if (!hasQuizAnswers(answers)) {
    return NextResponse.json({ error: 'Complete the compatibility quiz first.' }, { status: 400 })
  }
  if (typeof score !== 'number' || score <= 0) {
    return NextResponse.json({ error: 'Invalid quiz score.' }, { status: 400 })
  }
  if (!VALID_SLUGS.includes(batchSlug as (typeof VALID_SLUGS)[number])) {
    return NextResponse.json({ error: 'Choose Batch A or Batch B.' }, { status: 400 })
  }
  if (!gender) {
    return NextResponse.json({ error: 'Select how you are joining the trip.' }, { status: 400 })
  }
  if (!dateChoice) {
    return NextResponse.json({ error: 'Choose a departure date.' }, { status: 400 })
  }

  const departureFields = await resolveDepartureForPersist(auth.service, batchSlug, dateChoice)

  const vector = answersToCompatibilityVector(answers)

  const updates: Record<string, unknown> = {
    quiz_answers: answers,
    quiz_score: score,
    compatibility_vector: vector,
    batch_slug: batchSlug,
    gender,
    date_choice: departureFields.date_choice,
    departure_id: departureFields.departure_id,
    profile_completed_at: new Date().toISOString(),
    kyc_status: 'submitted',
  }

  if (auth.applicant.status === 'paid') {
    updates.status = 'approved'
  }

  const { match } = await buildApplicantMatchInsight(
    auth.service,
    normalizeQuizAnswers(answers),
    batchSlug
  )
  if (match) {
    updates.match_insight = {
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

  let { error: updateError } = await auth.service
    .from('applicants')
    .update(updates)
    .eq('id', auth.applicant.id)

  if (updateError?.message?.includes('profile_completed_at')) {
    const { profile_completed_at: _removed, ...withoutTimestamp } = updates
    ;({ error: updateError } = await auth.service
      .from('applicants')
      .update(withoutTimestamp)
      .eq('id', auth.applicant.id))
  }

  if (updateError) {
    console.error('[POST /api/account/complete-profile]', updateError)
    return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 })
  }

  const spotField = gender === 'm' ? 'spots_taken_m' : 'spots_taken_f'
  const { data: batchRow } = await auth.service
    .from('batches')
    .select(spotField)
    .eq('slug', batchSlug)
    .single()

  if (batchRow && !auth.applicant.batch_slug) {
    const current = (batchRow as Record<string, number>)[spotField] ?? 0
    await auth.service
      .from('batches')
      .update({ [spotField]: current + 1 })
      .eq('slug', batchSlug)
  }

  return NextResponse.json({ success: true })
}
