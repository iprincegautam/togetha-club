import type { QuizAnswers } from '@/types/quiz'

/** Normalize quiz answers stored with string keys from JSONB. */
export function normalizeQuizAnswers(raw: unknown): QuizAnswers {
  if (!raw || typeof raw !== 'object') return {}
  const answers: QuizAnswers = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number(key)
    if (!Number.isFinite(id)) continue
    if (typeof value === 'number' || typeof value === 'string') {
      answers[id] = value
    }
  }
  return answers
}

export function hasQuizAnswers(raw: unknown): boolean {
  const answers = normalizeQuizAnswers(raw)
  return Object.keys(answers).length >= 3
}
