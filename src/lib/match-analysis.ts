import type { SupabaseClient } from '@supabase/supabase-js'
import {
  analyzeBatchMatch,
  analyzeMatchProfile,
  answersToCompatibilityVector,
  getBatchMatch,
} from '@/lib/match-engine'
import { fetchCohortInsight } from '@/lib/match-cohort'
import { buildFallbackNarrative, generateAiNarrative } from '@/lib/match-narrative'
import type { BatchMatchResult, CohortInsight, MatchAnalysis, MatchableBatchSlug } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

type EnrichOptions = {
  includeNarrative?: boolean
}

function applyCohortToMatch(
  match: BatchMatchResult,
  cohort: CohortInsight | null,
  answers: QuizAnswers,
  includeNarrative: boolean
): BatchMatchResult {
  const cohortMatchPercent = cohort?.cohortMatchPercent ?? null
  const cohortStrongMatchPercent = cohort?.strongMatchPercent ?? null
  const cohortSampleSize = cohort?.sampleSize ?? 0

  let placementChance = match.placementChance
  if (cohort && cohort.sampleSize >= 3 && cohortMatchPercent !== null) {
    placementChance = Math.min(
      96,
      Math.max(58, Math.round(match.placementChance * 0.65 + cohortMatchPercent * 0.35))
    )
  }

  const aiNarrative = includeNarrative
    ? buildFallbackNarrative(answers, { ...match, placementChance }, cohort)
    : null

  return {
    ...match,
    placementChance,
    cohortMatchPercent,
    cohortStrongMatchPercent,
    cohortSampleSize,
    aiNarrative,
  }
}

async function attachNarrative(
  match: BatchMatchResult,
  answers: QuizAnswers,
  cohort: CohortInsight | null
): Promise<BatchMatchResult> {
  const aiGenerated = await generateAiNarrative(answers, match, cohort)
  return {
    ...match,
    aiNarrative: aiGenerated ?? match.aiNarrative ?? buildFallbackNarrative(answers, match, cohort),
  }
}

export async function enrichBatchMatch(
  service: SupabaseClient | null,
  answers: QuizAnswers,
  batchSlug: MatchableBatchSlug,
  options: EnrichOptions = {}
): Promise<BatchMatchResult> {
  const includeNarrative = options.includeNarrative ?? false
  const base = getBatchMatch(answers, batchSlug)
  const userVector = answersToCompatibilityVector(answers)
  const cohort = service ? await fetchCohortInsight(service, batchSlug, userVector) : null
  let match = applyCohortToMatch(base, cohort, answers, includeNarrative)

  if (includeNarrative) {
    match = await attachNarrative(match, answers, cohort)
  }

  return match
}

export async function buildEnrichedMatchAnalysis(
  service: SupabaseClient | null,
  answers: QuizAnswers,
  options: EnrichOptions = {}
): Promise<MatchAnalysis> {
  const base = analyzeMatchProfile(answers)
  const batches = await Promise.all(
    base.batches.map((batch) => enrichBatchMatch(service, answers, batch.batchSlug, options))
  )
  const sorted = [...batches].sort((a, b) => b.matchScore - a.matchScore)

  return {
    ...base,
    primaryBatch: sorted[0]?.batchSlug ?? base.primaryBatch,
    isHighMatch: (sorted[0]?.matchScore ?? base.batches[0]?.matchScore ?? 72) >= 82,
    batches: batches.map((batch) => ({
      ...batch,
      recommended: batch.batchSlug === sorted[0]?.batchSlug,
    })),
  }
}

export async function buildApplicantMatchInsight(
  service: SupabaseClient | null,
  answers: QuizAnswers | null,
  batchSlug: string | null
): Promise<{ match: BatchMatchResult | null; vector: ReturnType<typeof answersToCompatibilityVector> | null }> {
  if (!answers || !batchSlug || (batchSlug !== 'batch-a' && batchSlug !== 'batch-b')) {
    return { match: null, vector: null }
  }

  const match = await enrichBatchMatch(service, answers, batchSlug, { includeNarrative: true })
  return {
    match,
    vector: answersToCompatibilityVector(answers),
  }
}

export function snapshotMatchInsight(match: BatchMatchResult) {
  return {
    matchScore: match.matchScore,
    placementChance: match.placementChance,
    cohortMatchPercent: match.cohortMatchPercent,
    cohortStrongMatchPercent: match.cohortStrongMatchPercent,
    cohortSampleSize: match.cohortSampleSize,
    aiNarrative: match.aiNarrative,
    peerMix: match.peerMix,
    confidence: match.confidence,
    computedAt: new Date().toISOString(),
  }
}

/** Lightweight client-side preview when API unavailable. */
export function analyzeBatchMatchLocal(
  answers: QuizAnswers,
  batchSlug: MatchableBatchSlug,
  recommended = false
): BatchMatchResult {
  return analyzeBatchMatch(answers, batchSlug, recommended)
}
