import { NextRequest, NextResponse } from 'next/server'
import { isDevelopment } from '@/lib/is-dev'
import { answersToCompatibilityVector } from '@/lib/match-engine'
import { isValidIndianPhone, normalizeIndianPhone } from '@/lib/phone'
import { hasQuizAnswers } from '@/lib/quiz-storage'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'
import type { QuizAnswers } from '@/types/quiz'

type ExistingApplicant = {
  quiz_score: number | null
  quiz_answers: Record<string, unknown> | null
  phone: string | null
}

function hasRichQuizAnswers(answers: unknown): answers is QuizAnswers {
  return hasQuizAnswers(answers as QuizAnswers)
}

/** Drop quiz fields from payload when upsert would wipe richer existing data. */
function protectExistingQuizFields(
  payload: Record<string, unknown>,
  existing: ExistingApplicant | null,
  incomingAnswers: unknown,
  incomingScore: unknown
): void {
  const incomingHasQuiz = hasRichQuizAnswers(incomingAnswers)
  const incomingScoreNum =
    typeof incomingScore === 'number' && Number.isFinite(incomingScore) ? incomingScore : null

  if (!incomingHasQuiz && existing?.quiz_answers && Object.keys(existing.quiz_answers).length > 0) {
    delete payload.quiz_answers
    delete payload.compatibility_vector
  }

  if (
    (incomingScoreNum === null || incomingScoreNum <= 0) &&
    existing?.quiz_score != null &&
    existing.quiz_score > 0
  ) {
    delete payload.quiz_score
  }
}

async function upsertApplicant(
  supabase: NonNullable<ReturnType<typeof tryCreateServiceRoleClient>>,
  payload: Record<string, unknown>
) {
  const attempt = await supabase
    .from('applicants')
    .upsert(payload, { onConflict: 'email' })
    .select('id')
    .single()

  if (attempt.error?.message?.includes('lead_source')) {
    const { lead_source: _drop, ...fallbackPayload } = payload
    return supabase.from('applicants').upsert(fallbackPayload, { onConflict: 'email' }).select('id').single()
  }

  return attempt
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, batchSlug, answers, score, batchRecommendation } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!email || !String(email).includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    if (!phone || !isValidIndianPhone(String(phone))) {
      return NextResponse.json(
        { error: 'Valid 10-digit Indian mobile number required' },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedPhone = normalizeIndianPhone(String(phone))
    const slug = batchSlug || batchRecommendation || null

    const supabase = tryCreateServiceRoleClient()
    if (!supabase) {
      if (isDevelopment()) {
        return NextResponse.json({ success: true, dev: true, applicantId: 'dev-applicant-id' })
      }
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { data: existing } = await supabase
      .from('applicants')
      .select('quiz_score, quiz_answers, phone')
      .eq('email', normalizedEmail)
      .maybeSingle()

    const payload: Record<string, unknown> = {
      email: normalizedEmail,
      name: name?.trim() || null,
      phone: normalizedPhone,
      batch_slug: slug,
      lead_source: 'apply',
    }

    if (hasRichQuizAnswers(answers)) {
      payload.quiz_answers = answers
      payload.quiz_score = typeof score === 'number' ? score : null
      payload.compatibility_vector = answersToCompatibilityVector(answers)
      // Prefer the apply-page batch slug over quiz recommendation so Udaipur
      // checkout cannot be rewritten to a Himalayan edition.
    }

    protectExistingQuizFields(payload, existing, answers, score)

    const { data, error } = await upsertApplicant(supabase, payload)
    if (error) throw error

    return NextResponse.json({ success: true, applicantId: data.id })
  } catch (err) {
    console.error('[POST /api/applicants/init]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
