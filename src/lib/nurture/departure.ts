import { QUIZ_DEPARTURE_QUESTION_ID } from '@/lib/batch-age'
import type { QuizAnswers } from '@/types/quiz'

export function readDepartureFromQuiz(answers: QuizAnswers): {
  state: 'selected' | 'skipped'
  label: string | null
} {
  const raw = answers[QUIZ_DEPARTURE_QUESTION_ID]
  if (typeof raw !== 'string') return { state: 'skipped', label: null }
  const label = raw.trim()
  if (!label) return { state: 'skipped', label: null }
  return { state: 'selected', label }
}

/** @deprecated Use resolveDepartureUrgency — kept for imports that expect label-only reads. */
export function buildDepartureFomoCopy(opts: {
  state: 'selected' | 'skipped'
  label: string | null
  nearestLabel: string | null
  vacantTotal: number
}): { fomoLine: string; ctaDateLine: string } {
  const scarcity =
    opts.vacantTotal > 0
      ? `${opts.vacantTotal} spot${opts.vacantTotal === 1 ? '' : 's'} still open on your edition`
      : 'Spots are filling fast on your edition'

  if (opts.state === 'selected' && opts.label) {
    return {
      fomoLine: `You picked ${opts.label} for your departure. ${scarcity} — boys and girls fill separately.`,
      ctaDateLine: `Confirm your spot for ${opts.label}`,
    }
  }

  if (opts.nearestLabel) {
    return {
      fomoLine: `Our next open Friday departure is ${opts.nearestLabel}. ${scarcity}.`,
      ctaDateLine: `Pick your date & reserve your slot`,
    }
  }

  return {
    fomoLine: `${scarcity}. Weekly Friday departures — Manali, Kasol, Sissu.`,
    ctaDateLine: `Choose your date & reserve`,
  }
}
