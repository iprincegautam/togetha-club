import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { QuizAnswers, QuizResult } from '@/types/quiz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a price in whole rupees (rounds paise fractions). */
export function formatPrice(rupees: number): string {
  const whole = Math.round(rupees)
  return `₹${whole.toLocaleString('en-IN')}`
}

/** Format an amount stored in paise. */
export function formatPaise(paise: number): string {
  return formatPrice(paise / 100)
}

/** Copy text with Clipboard API, falling back to execCommand. */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // fall through to legacy copy
    }
  }

  if (typeof document === 'undefined') {
    throw new Error('Copy is not available in this environment.')
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!ok) throw new Error('Copy failed')
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
