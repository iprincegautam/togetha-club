export const QUIZ_LEAD_STORAGE_KEY = 'togetha_quiz_lead'

export type SavedQuizLead = {
  applicantId: string
  email: string
  name: string
  phone: string
  savedAt: string
}

export function saveQuizLead(lead: SavedQuizLead): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(QUIZ_LEAD_STORAGE_KEY, JSON.stringify(lead))
  } catch {
    // ignore quota / private mode
  }
}

export function loadQuizLead(): SavedQuizLead | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(QUIZ_LEAD_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedQuizLead
    if (!parsed?.applicantId || !parsed?.email || !parsed?.phone) return null
    return parsed
  } catch {
    return null
  }
}

export function hasCompletedQuizLead(): boolean {
  return loadQuizLead() !== null
}

export function clearQuizLead(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(QUIZ_LEAD_STORAGE_KEY)
  } catch {
    // ignore
  }
}
