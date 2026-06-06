import { NextResponse } from 'next/server'
import { buildEnrichedMatchAnalysis, enrichBatchMatch } from '@/lib/match-analysis'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'
import type { MatchableBatchSlug } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

function isMatchableBatch(value: string): value is MatchableBatchSlug {
  return value === 'batch-a' || value === 'batch-b'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const answers = body.answers as QuizAnswers | undefined
    const batchSlug = body.batchSlug as string | undefined
    const includeNarrative = Boolean(body.includeNarrative)

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Quiz answers required' }, { status: 400 })
    }

    const service = tryCreateServiceRoleClient()

    if (batchSlug) {
      if (!isMatchableBatch(batchSlug)) {
        return NextResponse.json({ error: 'Invalid batch slug' }, { status: 400 })
      }
      const match = await enrichBatchMatch(service, answers, batchSlug, { includeNarrative })
      return NextResponse.json({ match })
    }

    const analysis = await buildEnrichedMatchAnalysis(service, answers, { includeNarrative })
    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('[POST /api/match/preview]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
