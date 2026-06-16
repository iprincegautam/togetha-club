import { NextRequest, NextResponse } from 'next/server'
import { isDevelopment } from '@/lib/is-dev'
import { answersToCompatibilityVector } from '@/lib/match-engine'
import { isValidIndianPhone, normalizeIndianPhone } from '@/lib/phone'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'
import type { QuizAnswers } from '@/types/quiz'

const VALID_LEAD_SOURCES = new Set(['quiz', 'quiz_match_lab'])

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

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    if (!phone || !isValidIndianPhone(String(phone))) {
      return NextResponse.json(
        { error: 'Valid 10-digit Indian mobile number required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizeIndianPhone(String(phone))
    const source = VALID_LEAD_SOURCES.has(leadSource) ? leadSource : 'quiz'

    const supabase = tryCreateServiceRoleClient()
    if (!supabase) {
      if (isDevelopment()) {
        return NextResponse.json({ success: true, dev: true, applicantId: 'dev-applicant-id' })
      }
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const vector = answersToCompatibilityVector((answers ?? {}) as QuizAnswers)

    const payload: Record<string, unknown> = {
      email: String(email).trim().toLowerCase(),
      name: name?.trim() || null,
      phone: normalizedPhone,
      quiz_answers: answers,
      quiz_score: score,
      batch_slug: batchRecommendation,
      compatibility_vector: vector,
      lead_source: source,
      priority_review: wantsCallback !== false,
    }

    const { data, error } = await supabase
      .from('applicants')
      .upsert(payload, { onConflict: 'email' })
      .select('id')
      .single()

    if (error) {
      if (error.message?.includes('lead_source')) {
        const { lead_source: _drop, ...fallbackPayload } = payload
        const retry = await supabase
          .from('applicants')
          .upsert(fallbackPayload, { onConflict: 'email' })
          .select('id')
          .single()
        if (retry.error) throw retry.error
        return NextResponse.json({ success: true, applicantId: retry.data.id })
      }
      throw error
    }

    return NextResponse.json({ success: true, applicantId: data.id })
  } catch (err) {
    console.error('[POST /api/quiz]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
