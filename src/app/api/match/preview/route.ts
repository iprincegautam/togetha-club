import { NextResponse } from 'next/server'
import { isDestinationSlug } from '@/constants/destinations'
import { buildEnrichedMatchAnalysis, enrichBatchMatch } from '@/lib/match-analysis'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'
import type { DestinationSlug } from '@/constants/destinations'
import type { MatchableBatchSlug } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

function isMatchableBatch(value: string): value is MatchableBatchSlug {
  return (
    value === 'batch-a' ||
    value === 'batch-b' ||
    value === 'batch-d' ||
    value === 'batch-e'
  )
}

function parseDestination(value: unknown): DestinationSlug | undefined {
  if (typeof value === 'string' && isDestinationSlug(value)) return value
  return undefined
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const answers = body.answers as QuizAnswers | undefined
    const batchSlug = body.batchSlug as string | undefined
    const includeNarrative = Boolean(body.includeNarrative)
    const destination = parseDestination(body.destination)

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

    const analysis = await buildEnrichedMatchAnalysis(service, answers, {
      includeNarrative,
      destination,
    })
    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('[POST /api/match/preview]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
