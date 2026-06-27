import type { buildApplicantMatchInsight } from '@/lib/match-analysis'

export function buildApplicantMatchInsightResponse(
  match: Awaited<ReturnType<typeof buildApplicantMatchInsight>>['match']
) {
  if (!match) return null
  return {
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
