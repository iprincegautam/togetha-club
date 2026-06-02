export type QuestionType = 'opts' | 'range' | 'text'

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

export interface QuizResult {
  score: number
  batchRecommendation: 'batch-a' | 'batch-b'
  isHighMatch: boolean
}
