import { NextRequest, NextResponse } from 'next/server'
import { isDevelopment } from '@/lib/is-dev'
import { answersToCompatibilityVector } from '@/lib/match-engine'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'
import type { QuizAnswers } from '@/types/quiz'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, answers, score, batchRecommendation } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const supabase = tryCreateServiceRoleClient()
    if (!supabase) {
      if (isDevelopment()) {
        return NextResponse.json({ success: true, dev: true })
      }
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const vector = answersToCompatibilityVector((answers ?? {}) as QuizAnswers)

    const { data, error } = await supabase
      .from('applicants')
      .upsert(
        {
          email,
          name: name || null,
          quiz_answers: answers,
          quiz_score: score,
          batch_slug: batchRecommendation,
          compatibility_vector: vector,
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, applicantId: data.id })
  } catch (err) {
    console.error('[POST /api/quiz]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
