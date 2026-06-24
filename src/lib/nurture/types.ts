import type { CohortTeaserPerson } from '@/lib/match-cohort-preview'
import type { MatchableBatchSlug } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

export type TextAnswerState = 'full' | 'partial' | 'skipped'

export type DepartureState = 'selected' | 'skipped' | 'passed'

export type DepartureUrgencyTier =
  | 'no_date'
  | 'standard'
  | 'warm'
  | 'urgent'
  | 'critical'
  | 'passed'

export type DepartureTone = 'soft' | 'normal' | 'firm' | 'hard'

export type NurtureDepartureContext = {
  state: DepartureState
  label: string | null
  effectiveLabel: string | null
  sublabel: string | null
  tier: DepartureUrgencyTier
  daysUntil: number | null
  isPassed: boolean
  pivotLabel: string | null
  fomoLine: string
  ctaDateLine: string
  urgencyPrefix: string | null
  tone: DepartureTone
}

export type NurtureCohortContext = {
  likeYouCount: number
  people: CohortTeaserPerson[]
  urgencyLine: string
  moreHiddenCount: number
}

export type NurtureEmailContext = {
  firstName: string
  email: string
  applicantId: string
  batchSlug: MatchableBatchSlug
  batchLabel: string
  batchAgeRange: string
  matchScore: number
  fitTier: 'strong' | 'solid'
  peerArchetype: string
  peerTagline: string
  metaphor: {
    state: TextAnswerState
    tease: string | null
    raw: string
  }
  mountains: {
    state: TextAnswerState
    tease: string | null
    raw: string
  }
  departure: NurtureDepartureContext
  cohort: NurtureCohortContext
  vacantBoys: number
  vacantGirls: number
  vacantTotal: number
  depositLabel: string
  unlockUrl: string
  batchUrl: string
  unsubscribeUrl: string
  quizAnswers: QuizAnswers
}

export type NurtureEmailContent = {
  subject: string
  text: string
  html: string
}
