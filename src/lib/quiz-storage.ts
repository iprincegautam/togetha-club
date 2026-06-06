export const QUIZ_ANSWERS_STORAGE_KEY = 'togetha_quiz_answers'

export function saveQuizAnswers(answers: Record<number, number | string>): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(QUIZ_ANSWERS_STORAGE_KEY, JSON.stringify(answers))
  } catch {
    // ignore quota / private mode
  }
}

export function loadQuizAnswers(): Record<number, number | string> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(QUIZ_ANSWERS_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Record<number, number | string>
  } catch {
    return null
  }
}

export function clearQuizAnswers(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(QUIZ_ANSWERS_STORAGE_KEY)
  } catch {
    // ignore
  }
}
