import type { MatchableBatchSlug } from '@/types/match'

import type { QuizAnswers } from '@/types/quiz'

export type TextAnswerState = 'full' | 'partial' | 'skipped'

export type DepartureState = 'selected' | 'skipped'

export type NurtureEmailContext = {
  firstName: string
  email: string
  applicantId: string
  batchSlug: MatchableBatchSlug
  batchLabel: string
  batchAgeRange: string
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
  departure: {
    state: DepartureState
    label: string | null
    sublabel: string | null
    fomoLine: string
    ctaDateLine: string
  }
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
