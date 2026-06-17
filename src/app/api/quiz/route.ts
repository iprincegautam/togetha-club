import { NextRequest, NextResponse } from 'next/server'
import { isDevelopment } from '@/lib/is-dev'
import { answersToCompatibilityVector } from '@/lib/match-engine'
import { extractDateChoiceFromAnswers } from '@/lib/nurture/context'
import { enrollQuizNurture } from '@/lib/nurture/send'
import { isValidIndianPhone, normalizeIndianPhone } from '@/lib/phone'
import { hasQuizAnswers } from '@/lib/quiz-storage'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'
import type { QuizAnswers } from '@/types/quiz'

const VALID_LEAD_SOURCES = new Set(['quiz', 'quiz_match_lab'])

type ExistingApplicant = {
  quiz_score: number | null
  quiz_answers: Record<string, unknown> | null
  phone: string | null
}

function protectExistingQuizFields(
  payload: Record<string, unknown>,
  existing: ExistingApplicant | null,
  incomingAnswers: unknown,
  incomingScore: unknown
): void {
  const incomingHasQuiz = hasQuizAnswers(incomingAnswers as QuizAnswers)
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

  if (attempt.error?.message?.includes('priority_review')) {
    const { priority_review: _drop, ...fallbackPayload } = payload
    return supabase.from('applicants').upsert(fallbackPayload, { onConflict: 'email' }).select('id').single()
  }

  return attempt
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      email,
      phone,
      answers,
      score,
      batchRecommendation,
      leadSource,
      wantsCallback,
    } = body

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

    if (!hasQuizAnswers(answers as QuizAnswers)) {
      return NextResponse.json({ error: 'Quiz answers required' }, { status: 400 })
    }

    if (typeof score !== 'number' || score <= 0) {
      return NextResponse.json({ error: 'Valid quiz score required' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedPhone = normalizeIndianPhone(String(phone))
    const source = VALID_LEAD_SOURCES.has(leadSource) ? leadSource : 'quiz'

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

    const vector = answersToCompatibilityVector(answers as QuizAnswers)
    const dateChoice = extractDateChoiceFromAnswers(answers)

    const payload: Record<string, unknown> = {
      email: normalizedEmail,
      name: name?.trim() || null,
      phone: normalizedPhone,
      quiz_answers: answers,
      quiz_score: score,
      batch_slug: batchRecommendation,
      compatibility_vector: vector,
      lead_source: source,
      priority_review: wantsCallback !== false,
    }

    if (dateChoice) {
      payload.date_choice = dateChoice
    }

    protectExistingQuizFields(payload, existing, answers, score)

    const { data, error } = await upsertApplicant(supabase, payload)
    if (error) throw error

    try {
      const nurtureResult = await enrollQuizNurture(supabase, data.id)
      if (!nurtureResult.ok) {
        console.error('[POST /api/quiz] nurture enroll failed', {
          applicantId: data.id,
          email: normalizedEmail,
          error: nurtureResult.error,
        })
      } else {
        console.info('[POST /api/quiz] nurture enrolled', {
          applicantId: data.id,
          email: normalizedEmail,
        })
      }
    } catch (nurtureErr) {
      console.error('[POST /api/quiz] nurture enroll threw', nurtureErr)
    }

    return NextResponse.json({ success: true, applicantId: data.id })
  } catch (err) {
    console.error('[POST /api/quiz]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
