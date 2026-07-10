import type { QuizAnswers } from '@/types/quiz'

export type MatchableBatchSlug = 'batch-a' | 'batch-b' | 'batch-d' | 'batch-e'

export type ArchetypeId =
  | 'bonfire_romantic'
  | 'chaos_catalyst'
  | 'thoughtful_planner'
  | 'free_spirit'
  | 'quiet_intensity'
  | 'golden_warmth'

export interface CompatibilityVector {
  socialEnergy: number
  directness: number
  depth: number
  spontaneity: number
  emotionalAvailability: number
  warmth: number
  humor: number
  adventure: number
  introspection: number
  loyalty: number
  curiosity: number
  authenticity: number
}

export interface PeerArchetypeBreakdown {
  id: ArchetypeId
  label: string
  tagline: string
  percent: number
}

export interface BatchMatchResult {
  batchSlug: MatchableBatchSlug
  batchLabel: string
  batchTagline: string
  ageRange: string
  matchScore: number
  placementChance: number
  confidence: 'high' | 'medium' | 'growing'
  headline: string
  summary: string
  peerMix: PeerArchetypeBreakdown[]
  connectionHighlights: string[]
  recommended: boolean
  userAge?: number | null
  ageEligible: boolean
  ageNote?: string | null
  cohortMatchPercent?: number | null
  cohortStrongMatchPercent?: number | null
  cohortSampleSize?: number
  aiNarrative?: string | null
}

export interface CohortInsight {
  sampleSize: number
  cohortMatchPercent: number
  strongMatchPercent: number
}

export interface ApplicantMatchInsight {
  batchSlug: MatchableBatchSlug | null
  match: BatchMatchResult | null
  vector: CompatibilityVector | null
}

export interface MatchAnalysis {
  vector: CompatibilityVector
  primaryBatch: MatchableBatchSlug
  isHighMatch: boolean
  batches: BatchMatchResult[]
}

export interface MatchPreviewRequest {
  answers: QuizAnswers
  batchSlug?: MatchableBatchSlug
}
