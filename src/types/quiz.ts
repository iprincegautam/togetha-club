export type QuestionType = 'opts' | 'range' | 'text' | 'age' | 'departure' | 'destination'

export interface QuizQuestion {
  id: number
  q: string
  sub?: string
  type: QuestionType
  opts?: string[]
  min?: string
  max?: string
  ph?: string
}

export interface QuizAnswers {
  [questionId: number]: number | string
}

import type { BatchMatchResult, MatchableBatchSlug } from '@/types/match'

export interface QuizResult {
  score: number
  batchRecommendation: MatchableBatchSlug
  isHighMatch: boolean
  batchMatches?: BatchMatchResult[]
}
