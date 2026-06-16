import { QUIZ_DEPARTURE_QUESTION_ID } from '@/lib/batch-age'
import type { QuizAnswers } from '@/types/quiz'
import type { DepartureState } from '@/lib/nurture/types'

export function readDepartureFromQuiz(answers: QuizAnswers): {
  state: DepartureState
  label: string | null
} {
  const raw = answers[QUIZ_DEPARTURE_QUESTION_ID]
  if (typeof raw !== 'string') return { state: 'skipped', label: null }
  const label = raw.trim()
  if (!label) return { state: 'skipped', label: null }
  return { state: 'selected', label }
}

export function buildDepartureFomoCopy(opts: {
  state: DepartureState
  label: string | null
  nearestLabel: string | null
  vacantTotal: number
}): { fomoLine: string; ctaDateLine: string } {
  const { state, label, nearestLabel, vacantTotal } = opts
  const scarcity =
    vacantTotal > 0
      ? `${vacantTotal} spot${vacantTotal === 1 ? '' : 's'} still open on your edition`
      : 'Spots are filling fast on your edition'

  if (state === 'selected' && label) {
    return {
      fomoLine: `You picked ${label} for your departure. ${scarcity} — boys and girls fill separately.`,
      ctaDateLine: `Confirm your spot for ${label}`,
    }
  }

  if (nearestLabel) {
    return {
      fomoLine: `Our next open Friday departure is ${nearestLabel}. ${scarcity}.`,
      ctaDateLine: `Pick your date & reserve your slot`,
    }
  }

  return {
    fomoLine: `${scarcity}. Weekly Friday departures — Manali, Kasol, Sissu.`,
    ctaDateLine: `Choose your date & reserve`,
  }
}
