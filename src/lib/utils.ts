import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { QuizAnswers, QuizResult } from '@/types/quiz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(paise: number): string {
  return `₹${paise.toLocaleString('en-IN')}`
}

export function calculateQuizResult(answers: QuizAnswers): QuizResult {
  let score = 72
  const emo = (answers[5] as number) || 7
  score += (emo - 5) * 2
  const fri = answers[1] !== undefined ? [2, 4, 1, 5][answers[1] as number] : 2
  score += fri
  const want = answers[6] !== undefined ? [3, 2, 4, 3][answers[6] as number] : 2
  score += want
  score = Math.min(97, Math.max(68, score))

  return {
    score,
    batchRecommendation: emo >= 6 ? 'batch-b' : 'batch-a',
    isHighMatch: score >= 82,
  }
}
