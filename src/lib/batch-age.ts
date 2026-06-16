import type { MatchableBatchSlug } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

export const QUIZ_AGE_QUESTION_ID = 0

export const QUIZ_DEPARTURE_QUESTION_ID = 11

export const BATCH_AGE_LIMITS: Record<
  MatchableBatchSlug,
  { min: number; max: number; label: string }
> = {
  'batch-a': { min: 18, max: 25, label: '18–25' },
  'batch-b': { min: 26, max: 36, label: '26–36' },
}

export function parseQuizAge(answers: QuizAnswers): number | null {
  const raw = answers[QUIZ_AGE_QUESTION_ID]
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.round(raw)
  }
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function isValidQuizAge(age: number): boolean {
  return Number.isInteger(age) && age >= 18 && age <= 99
}

export function isAgeEligibleForBatch(age: number, batchSlug: MatchableBatchSlug): boolean {
  const limits = BATCH_AGE_LIMITS[batchSlug]
  return age >= limits.min && age <= limits.max
}

export function getEligibleBatchesForAge(age: number): MatchableBatchSlug[] {
  return (Object.keys(BATCH_AGE_LIMITS) as MatchableBatchSlug[]).filter((slug) =>
    isAgeEligibleForBatch(age, slug)
  )
}

export function primaryBatchForAge(age: number): MatchableBatchSlug | null {
  const eligible = getEligibleBatchesForAge(age)
  return eligible[0] ?? null
}

export function ageNoteForBatch(age: number, batchSlug: MatchableBatchSlug): string | null {
  const limits = BATCH_AGE_LIMITS[batchSlug]
  if (isAgeEligibleForBatch(age, batchSlug)) {
    return null
  }

  const eligible = getEligibleBatchesForAge(age)
  if (eligible.length === 1) {
    const target = BATCH_AGE_LIMITS[eligible[0]]
    const targetName = eligible[0] === 'batch-a' ? 'GenZ Edition' : 'Millennial Edition'
    return `You're ${age}. This batch is for ages ${limits.label} — ${targetName} (${target.label}) is the better fit.`
  }

  if (age < BATCH_AGE_LIMITS['batch-a'].min) {
    return `You're ${age}. Our trips are currently for ages ${BATCH_AGE_LIMITS['batch-a'].min}–${BATCH_AGE_LIMITS['batch-b'].max}.`
  }

  return `You're ${age}. GenZ Edition is ages ${BATCH_AGE_LIMITS['batch-a'].label}; Millennial Edition is ages ${BATCH_AGE_LIMITS['batch-b'].label}.`
}
