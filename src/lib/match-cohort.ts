import type { SupabaseClient } from '@supabase/supabase-js'
import {
  answersToCompatibilityVector,
  vectorSimilarity,
} from '@/lib/match-engine'
import { hasQuizAnswers, normalizeQuizAnswers } from '@/lib/quiz-normalize'
import type { CohortInsight, CompatibilityVector, MatchableBatchSlug } from '@/types/match'

const COHORT_STATUSES = ['approved', 'paid', 'deposit_paid'] as const
const STRONG_MATCH_THRESHOLD = 0.72

function isCompatibilityVector(value: unknown): value is CompatibilityVector {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return typeof row.emotionalAvailability === 'number' && typeof row.socialEnergy === 'number'
}

function rowToVector(row: {
  compatibility_vector: unknown
  quiz_answers: unknown
}): CompatibilityVector | null {
  if (isCompatibilityVector(row.compatibility_vector)) {
    return row.compatibility_vector
  }
  if (hasQuizAnswers(row.quiz_answers)) {
    return answersToCompatibilityVector(normalizeQuizAnswers(row.quiz_answers))
  }
  return null
}

export function computeCohortInsight(
  userVector: CompatibilityVector,
  cohortVectors: CompatibilityVector[]
): CohortInsight | null {
  if (cohortVectors.length === 0) return null

  const similarities = cohortVectors.map((vector) => vectorSimilarity(userVector, vector))
  const avg = similarities.reduce((sum, n) => sum + n, 0) / similarities.length
  const strong = similarities.filter((n) => n >= STRONG_MATCH_THRESHOLD).length

  return {
    sampleSize: cohortVectors.length,
    cohortMatchPercent: Math.min(96, Math.max(52, Math.round(avg * 100))),
    strongMatchPercent: Math.round((strong / similarities.length) * 100),
  }
}

export async function fetchCohortVectors(
  service: SupabaseClient,
  batchSlug: MatchableBatchSlug
): Promise<CompatibilityVector[]> {
  const { data, error } = await service
    .from('applicants')
    .select('compatibility_vector, quiz_answers, status, batch_slug')
    .eq('batch_slug', batchSlug)
    .in('status', [...COHORT_STATUSES])

  if (error) {
    console.error('[fetchCohortVectors]', error.message)
    return []
  }

  let vectors = (data ?? [])
    .map((row) => rowToVector(row))
    .filter((vector): vector is CompatibilityVector => vector !== null)

  if (vectors.length < 3) {
    const { data: fallback } = await service
      .from('applicants')
      .select('compatibility_vector, quiz_answers')
      .eq('batch_slug', batchSlug)
      .not('quiz_answers', 'is', null)
      .limit(40)

    vectors = (fallback ?? [])
      .map((row) => rowToVector(row))
      .filter((vector): vector is CompatibilityVector => vector !== null)
  }

  return vectors
}

export async function fetchCohortInsight(
  service: SupabaseClient,
  batchSlug: MatchableBatchSlug,
  userVector: CompatibilityVector
): Promise<CohortInsight | null> {
  const vectors = await fetchCohortVectors(service, batchSlug)
  return computeCohortInsight(userVector, vectors)
}
