import { BATCH_META } from '@/constants/batches'
import {
  getDestinationForBatch,
  getEditionSlugsForDestination,
  type DestinationSlug,
} from '@/constants/destinations'
import {
  ageNoteForBatch,
  isAgeEligibleForBatch,
  parseQuizAge,
  primaryBatchForAge,
} from '@/lib/batch-age'
import type {
  ArchetypeId,
  BatchMatchResult,
  CompatibilityVector,
  MatchAnalysis,
  MatchableBatchSlug,
  PeerArchetypeBreakdown,
} from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

const ARCHETYPE_META: Record<
  ArchetypeId,
  { label: string; tagline: string; vector: CompatibilityVector }
> = {
  bonfire_romantic: {
    label: 'The Bonfire Romantic',
    tagline: 'One-on-one depth, slow burns, and 2am honesty',
    vector: {
      socialEnergy: 0.45,
      directness: 0.55,
      depth: 0.95,
      spontaneity: 0.5,
      emotionalAvailability: 0.85,
      warmth: 0.8,
      humor: 0.55,
      adventure: 0.45,
      introspection: 0.9,
      loyalty: 0.85,
      curiosity: 0.7,
      authenticity: 0.9,
    },
  },
  chaos_catalyst: {
    label: 'The Chaos Catalyst',
    tagline: 'Loud energy, group games, and unplanned magic',
    vector: {
      socialEnergy: 0.95,
      directness: 0.85,
      depth: 0.45,
      spontaneity: 0.9,
      emotionalAvailability: 0.65,
      warmth: 0.7,
      humor: 0.95,
      adventure: 0.85,
      introspection: 0.35,
      loyalty: 0.55,
      curiosity: 0.8,
      authenticity: 0.75,
    },
  },
  thoughtful_planner: {
    label: 'The Thoughtful Planner',
    tagline: 'Reliable, warm, and quietly intentional',
    vector: {
      socialEnergy: 0.5,
      directness: 0.6,
      depth: 0.75,
      spontaneity: 0.25,
      emotionalAvailability: 0.8,
      warmth: 0.9,
      humor: 0.5,
      adventure: 0.4,
      introspection: 0.7,
      loyalty: 0.95,
      curiosity: 0.65,
      authenticity: 0.8,
    },
  },
  free_spirit: {
    label: 'The Free Spirit',
    tagline: 'Vibe-led, spontaneous, and hard to forget',
    vector: {
      socialEnergy: 0.7,
      directness: 0.7,
      depth: 0.55,
      spontaneity: 0.95,
      emotionalAvailability: 0.6,
      warmth: 0.65,
      humor: 0.75,
      adventure: 0.95,
      introspection: 0.5,
      loyalty: 0.5,
      curiosity: 0.95,
      authenticity: 0.85,
    },
  },
  quiet_intensity: {
    label: 'The Quiet Intensity',
    tagline: 'Observant first — profound when they open up',
    vector: {
      socialEnergy: 0.3,
      directness: 0.45,
      depth: 0.9,
      spontaneity: 0.4,
      emotionalAvailability: 0.7,
      warmth: 0.55,
      humor: 0.4,
      adventure: 0.55,
      introspection: 0.95,
      loyalty: 0.8,
      curiosity: 0.85,
      authenticity: 0.95,
    },
  },
  golden_warmth: {
    label: 'The Golden Retriever',
    tagline: 'Easy warmth that makes the whole group feel safe',
    vector: {
      socialEnergy: 0.75,
      directness: 0.65,
      depth: 0.6,
      spontaneity: 0.55,
      emotionalAvailability: 0.75,
      warmth: 0.95,
      humor: 0.8,
      adventure: 0.5,
      introspection: 0.45,
      loyalty: 0.85,
      curiosity: 0.6,
      authenticity: 0.7,
    },
  },
}

const BATCH_PROFILES: Record<
  MatchableBatchSlug,
  {
    idealVector: CompatibilityVector
    baselinePeerMix: Record<ArchetypeId, number>
    minEmotionalAvailability: number
  }
> = {
  'batch-a': {
    minEmotionalAvailability: 0.5,
    idealVector: {
      socialEnergy: 0.82,
      directness: 0.78,
      depth: 0.58,
      spontaneity: 0.88,
      emotionalAvailability: 0.68,
      warmth: 0.72,
      humor: 0.9,
      adventure: 0.85,
      introspection: 0.45,
      loyalty: 0.6,
      curiosity: 0.8,
      authenticity: 0.78,
    },
    baselinePeerMix: {
      chaos_catalyst: 28,
      bonfire_romantic: 22,
      free_spirit: 20,
      golden_warmth: 14,
      thoughtful_planner: 8,
      quiet_intensity: 8,
    },
  },
  'batch-b': {
    minEmotionalAvailability: 0.58,
    idealVector: {
      socialEnergy: 0.55,
      directness: 0.62,
      depth: 0.88,
      spontaneity: 0.48,
      emotionalAvailability: 0.82,
      warmth: 0.85,
      humor: 0.58,
      adventure: 0.52,
      introspection: 0.82,
      loyalty: 0.88,
      curiosity: 0.72,
      authenticity: 0.9,
    },
    baselinePeerMix: {
      bonfire_romantic: 26,
      thoughtful_planner: 22,
      quiet_intensity: 18,
      golden_warmth: 16,
      free_spirit: 10,
      chaos_catalyst: 8,
    },
  },
  'batch-d': {
    minEmotionalAvailability: 0.5,
    idealVector: {
      socialEnergy: 0.82,
      directness: 0.78,
      depth: 0.58,
      spontaneity: 0.88,
      emotionalAvailability: 0.68,
      warmth: 0.72,
      humor: 0.9,
      adventure: 0.85,
      introspection: 0.45,
      loyalty: 0.6,
      curiosity: 0.8,
      authenticity: 0.78,
    },
    baselinePeerMix: {
      chaos_catalyst: 28,
      bonfire_romantic: 22,
      free_spirit: 20,
      golden_warmth: 14,
      thoughtful_planner: 8,
      quiet_intensity: 8,
    },
  },
  'batch-e': {
    minEmotionalAvailability: 0.58,
    idealVector: {
      socialEnergy: 0.55,
      directness: 0.62,
      depth: 0.88,
      spontaneity: 0.48,
      emotionalAvailability: 0.82,
      warmth: 0.85,
      humor: 0.58,
      adventure: 0.52,
      introspection: 0.82,
      loyalty: 0.88,
      curiosity: 0.72,
      authenticity: 0.9,
    },
    baselinePeerMix: {
      bonfire_romantic: 26,
      thoughtful_planner: 22,
      quiet_intensity: 18,
      golden_warmth: 16,
      free_spirit: 10,
      chaos_catalyst: 8,
    },
  },
}

const VECTOR_KEYS = Object.keys(ARCHETYPE_META.bonfire_romantic.vector) as (keyof CompatibilityVector)[]

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function opt(answers: QuizAnswers, id: number, fallback = 0): number {
  const value = answers[id]
  return typeof value === 'number' ? value : fallback
}

function textScore(answers: QuizAnswers, id: number): number {
  const value = answers[id]
  if (typeof value !== 'string') return 0.45
  const len = value.trim().length
  if (len >= 80) return 0.95
  if (len >= 40) return 0.8
  if (len >= 15) return 0.65
  if (len >= 5) return 0.5
  return 0.35
}

/** Convert quiz answers into the 12-dimension vector referenced on the marketing site. */
export function answersToCompatibilityVector(answers: QuizAnswers): CompatibilityVector {
  const q1 = opt(answers, 1, 1)
  const q2 = opt(answers, 2, 1)
  const q3 = opt(answers, 3, 1)
  const q4 = opt(answers, 4, 1)
  const q6 = opt(answers, 6, 1)
  const q8 = opt(answers, 8, 1)
  const q9 = opt(answers, 9, 1)
  const emo = clamp01(((answers[5] as number) || 7) / 10)
  const metaphor = textScore(answers, 7)
  const mountains = textScore(answers, 10)

  return {
    socialEnergy: clamp01([0.95, 0.35, 0.2, 0.75][q1] ?? 0.55),
    directness: clamp01([0.75, 0.85, 0.45, 0.8][q2] ?? 0.6),
    depth: clamp01([0.85, 0.55, 0.7, 0.8][q3] ?? 0.65),
    spontaneity: clamp01([0.15, 0.75, 0.95, 0.55][q4] ?? 0.55),
    emotionalAvailability: emo,
    warmth: clamp01(
      ([0.75, 0.55, 0.45, 0.85][q6] ?? 0.65) + ([0, 0.05, 0.1, 0.08][q9] ?? 0)
    ),
    humor: clamp01([0.55, 0.65, 0.45, 0.85][q2] ?? 0.6),
    adventure: clamp01([0.45, 0.85, 0.95, 0.6][q4] ?? 0.6),
    introspection: clamp01([0.35, 0.85, 0.95, 0.55][q8] ?? 0.55),
    loyalty: clamp01([0.9, 0.45, 0.55, 0.85][q3] ?? 0.65),
    curiosity: clamp01(0.45 + metaphor * 0.35 + mountains * 0.2),
    authenticity: clamp01(0.4 + metaphor * 0.35 + mountains * 0.25 + emo * 0.15),
  }
}

export function vectorSimilarity(a: CompatibilityVector, b: CompatibilityVector): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (const key of VECTOR_KEYS) {
    dot += a[key] * b[key]
    normA += a[key] ** 2
    normB += b[key] ** 2
  }
  if (normA === 0 || normB === 0) return 0.65
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function archetypeAffinity(user: CompatibilityVector, id: ArchetypeId): number {
  return vectorSimilarity(user, ARCHETYPE_META[id].vector)
}

function normalizePeerMix(weights: Record<ArchetypeId, number>): PeerArchetypeBreakdown[] {
  const total = Object.values(weights).reduce((sum, n) => sum + n, 0) || 1
  return (Object.keys(weights) as ArchetypeId[])
    .map((id) => ({
      id,
      label: ARCHETYPE_META[id].label,
      tagline: ARCHETYPE_META[id].tagline,
      percent: Math.round((weights[id] / total) * 100),
    }))
    .filter((row) => row.percent >= 6)
    .sort((a, b) => b.percent - a.percent)
}

function computePeerMix(
  user: CompatibilityVector,
  batchSlug: MatchableBatchSlug
): PeerArchetypeBreakdown[] {
  const profile = BATCH_PROFILES[batchSlug]
  const weights = {} as Record<ArchetypeId, number>

  for (const id of Object.keys(ARCHETYPE_META) as ArchetypeId[]) {
    const baseline = profile.baselinePeerMix[id]
    const affinity = archetypeAffinity(user, id)
    weights[id] = baseline * (0.55 + affinity * 0.75)
  }

  return normalizePeerMix(weights)
}

function computePlacementChance(
  matchScore: number,
  emotionalAvailability: number,
  batchSlug: MatchableBatchSlug
): number {
  const min = BATCH_PROFILES[batchSlug].minEmotionalAvailability
  const readinessPenalty =
    emotionalAvailability < min ? (min - emotionalAvailability) * 35 : 0
  const raw = matchScore * 0.72 + emotionalAvailability * 22 - readinessPenalty
  return Math.min(96, Math.max(58, Math.round(raw)))
}

function buildHeadline(matchScore: number, batchSlug: MatchableBatchSlug): string {
  const label = BATCH_META[batchSlug].label
  if (matchScore >= 88) return `Strong fit for ${label}. Our AI likes this pairing.`
  if (matchScore >= 78) return `Solid fit for ${label}. You'd add real texture to this batch.`
  return `Interesting fit for ${label}. You'd bring a curveball the group needs.`
}

function buildSummary(
  matchScore: number,
  batchSlug: MatchableBatchSlug,
  peerMix: PeerArchetypeBreakdown[]
): string {
  const meta = BATCH_META[batchSlug]
  const lead = peerMix[0]?.label ?? 'your kind of people'
  if (matchScore >= 85) {
    return `Your compatibility profile aligns with ${meta.tagline.toLowerCase()} energy. Among the batchmates you're most likely to click with, ${lead.toLowerCase()} types show up often.`
  }
  return `${meta.label} skews ${meta.tagline.toLowerCase()}. Your answers suggest you'd connect most naturally with ${lead.toLowerCase()} energy — not random strangers, but people who match how you actually show up.`
}

function buildHighlights(peerMix: PeerArchetypeBreakdown[], batchSlug: MatchableBatchSlug): string[] {
  const meta = BATCH_META[batchSlug]
  const top = peerMix.slice(0, 3)
  return [
    `${top[0]?.percent ?? 0}% of your likely connections look like ${top[0]?.label ?? 'your vibe'} — ${top[0]?.tagline.toLowerCase() ?? 'your kind of energy'}.`,
    top[1]
      ? `Another ${top[1].percent}% skew ${top[1].label.toLowerCase()} — the mix ${meta.label.toLowerCase()} batches are known for.`
      : `This batch is curated for ${meta.tagline.toLowerCase()} — not tourist-group randomness.`,
    `Our algorithm weights emotional availability, communication style, and the weird stuff you wrote in the quiz — the same signals we use when building each ${meta.ageRange} cohort.`,
  ]
}

export function analyzeBatchMatch(
  answers: QuizAnswers,
  batchSlug: MatchableBatchSlug,
  recommended = false
): BatchMatchResult {
  const user = answersToCompatibilityVector(answers)
  const profile = BATCH_PROFILES[batchSlug]
  const meta = BATCH_META[batchSlug]
  const userAge = parseQuizAge(answers)
  const ageEligible = userAge === null ? true : isAgeEligibleForBatch(userAge, batchSlug)
  const ageNote = userAge === null ? null : ageNoteForBatch(userAge, batchSlug)

  const similarity = vectorSimilarity(user, profile.idealVector)
  let matchScore = Math.min(97, Math.max(68, Math.round(similarity * 88 + user.authenticity * 9)))
  const peerMix = computePeerMix(user, batchSlug)
  let placementChance = computePlacementChance(
    matchScore,
    user.emotionalAvailability,
    batchSlug
  )

  let headline = buildHeadline(matchScore, batchSlug)
  if (userAge !== null && !ageEligible) {
    matchScore = Math.min(matchScore, 62)
    placementChance = Math.min(placementChance, 28)
    headline = `Outside the ${meta.ageRange} age band for ${meta.label}`
  }

  return {
    batchSlug,
    batchLabel: meta.label,
    batchTagline: meta.tagline,
    ageRange: meta.ageRange,
    matchScore,
    placementChance,
    confidence: matchScore >= 85 ? 'high' : matchScore >= 76 ? 'medium' : 'growing',
    headline,
    summary: buildSummary(matchScore, batchSlug, peerMix),
    peerMix,
    connectionHighlights: buildHighlights(peerMix, batchSlug),
    recommended,
    userAge,
    ageEligible,
    ageNote,
  }
}

export function analyzeMatchProfile(
  answers: QuizAnswers,
  destination: DestinationSlug = 'himalayan'
): MatchAnalysis {
  const userAge = parseQuizAge(answers)
  const editionSlugs = getEditionSlugsForDestination(destination)
  const batches = editionSlugs.map((slug) => analyzeBatchMatch(answers, slug))

  let primaryBatch: MatchableBatchSlug = editionSlugs[0]
  if (userAge !== null) {
    const agePrimary = primaryBatchForAge(userAge, destination)
    if (agePrimary) {
      primaryBatch = agePrimary
    } else {
      const sorted = [...batches].sort((a, b) => b.matchScore - a.matchScore)
      primaryBatch = sorted[0]?.batchSlug ?? editionSlugs[0]
    }
  } else {
    const sorted = [...batches].sort((a, b) => b.matchScore - a.matchScore)
    primaryBatch = sorted[0]?.batchSlug ?? editionSlugs[0]
  }

  const primaryScore =
    batches.find((batch) => batch.batchSlug === primaryBatch)?.matchScore ?? 72

  return {
    vector: answersToCompatibilityVector(answers),
    primaryBatch,
    isHighMatch: primaryScore >= 82 && (userAge === null || isAgeEligibleForBatch(userAge, primaryBatch)),
    batches: batches.map((batch) => ({
      ...batch,
      recommended: batch.batchSlug === primaryBatch,
    })),
  }
}

export function getBatchMatch(
  answers: QuizAnswers,
  batchSlug: MatchableBatchSlug
): BatchMatchResult {
  const destination = getDestinationForBatch(batchSlug) ?? 'himalayan'
  const analysis = analyzeMatchProfile(answers, destination)
  return (
    analysis.batches.find((batch) => batch.batchSlug === batchSlug) ??
    analyzeBatchMatch(answers, batchSlug)
  )
}
