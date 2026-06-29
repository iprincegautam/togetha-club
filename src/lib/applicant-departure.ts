import type { SupabaseClient } from '@supabase/supabase-js'
import { getBatchDateOptions } from '@/constants/batches'
import {
  generateFridayDepartures,
  isDepartureVisible,
  VISIBLE_DEPARTURE_WEEKS,
} from '@/lib/batch-departure-dates'
import { fetchBatchDepartures } from '@/lib/batches'
import { readDepartureFromQuiz } from '@/lib/nurture/departure'
import { normalizeQuizAnswers } from '@/lib/quiz-normalize'

export type ApplicantDepartureContext = {
  dateChoice?: string | null
  batchSlug?: string | null
  departureLabel?: string | null
  quizAnswers?: unknown
  bookedAt?: string | null
}

export function isNumericDateChoice(dateChoice: string): boolean {
  return /^\d+$/.test(dateChoice.trim())
}

export function dateLabelOptionsAt(batchSlug: string, asOf: Date): { label: string; sublabel: string }[] {
  return generateFridayDepartures()
    .filter((d) => isDepartureVisible(d.departure_date, VISIBLE_DEPARTURE_WEEKS, asOf))
    .map((d) => ({ label: d.label, sublabel: d.sublabel }))
}

export function resolveIndexToLabelAt(index: number, batchSlug: string, asOf: Date): string | null {
  const options = dateLabelOptionsAt(batchSlug, asOf)
  return options[index]?.label ?? null
}

export function departureDateForLabel(label: string): string | null {
  const match = generateFridayDepartures().find((d) => d.label === label)
  return match?.departure_date ?? null
}

export function resolveApplicantDeparture(ctx: ApplicantDepartureContext): {
  label: string | null
  departureDate: string | null
} {
  const slug = ctx.batchSlug ?? ''

  if (ctx.departureLabel?.trim()) {
    const label = ctx.departureLabel.trim()
    return { label, departureDate: departureDateForLabel(label) }
  }

  const dateChoice = ctx.dateChoice?.trim()
  if (!dateChoice) {
    const quiz = readDepartureFromQuiz(normalizeQuizAnswers(ctx.quizAnswers ?? {}))
    if (quiz.state === 'selected' && quiz.label) {
      return { label: quiz.label, departureDate: departureDateForLabel(quiz.label) }
    }
    return { label: null, departureDate: null }
  }

  if (!isNumericDateChoice(dateChoice)) {
    return { label: dateChoice, departureDate: departureDateForLabel(dateChoice) }
  }

  if (ctx.quizAnswers) {
    const quiz = readDepartureFromQuiz(normalizeQuizAnswers(ctx.quizAnswers))
    if (quiz.state === 'selected' && quiz.label) {
      return { label: quiz.label, departureDate: departureDateForLabel(quiz.label) }
    }
  }

  const index = Number(dateChoice)
  if (Number.isNaN(index) || !slug) {
    return { label: dateChoice, departureDate: null }
  }

  if (ctx.bookedAt) {
    const atBooking = resolveIndexToLabelAt(index, slug, new Date(ctx.bookedAt))
    if (atBooking) {
      return { label: atBooking, departureDate: departureDateForLabel(atBooking) }
    }
  }

  const current = getBatchDateOptions(slug)[index]?.label
  return {
    label: current ?? dateChoice,
    departureDate: current ? departureDateForLabel(current) : null,
  }
}

export function resolveApplicantDepartureLabel(
  dateChoice: string | null | undefined,
  batchSlug: string | null | undefined,
  context?: Omit<ApplicantDepartureContext, 'dateChoice' | 'batchSlug'>
): string | null {
  return resolveApplicantDeparture({ dateChoice, batchSlug, ...context }).label
}

export function parseBatchDepartureRelation(
  relation: { label: string } | { label: string }[] | null | undefined
): string | null {
  if (!relation) return null
  if (Array.isArray(relation)) return relation[0]?.label ?? null
  return relation.label ?? null
}

async function findDepartureIdByLabel(
  supabase: SupabaseClient | null,
  batchSlug: string,
  label: string
): Promise<string | null> {
  if (!supabase) return null

  const { data } = await supabase
    .from('batch_departures')
    .select('id')
    .eq('batch_slug', batchSlug)
    .eq('label', label)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (data?.id) return data.id

  const departureDate = departureDateForLabel(label)
  if (!departureDate) return null

  const { data: byDate } = await supabase
    .from('batch_departures')
    .select('id')
    .eq('batch_slug', batchSlug)
    .eq('departure_date', departureDate)
    .neq('status', 'cancelled')
    .maybeSingle()

  return byDate?.id ?? null
}

/** Resolve a UI index or label into stable fields for applicants.date_choice + departure_id. */
export async function resolveDepartureForPersist(
  supabase: SupabaseClient | null,
  batchSlug: string,
  dateChoiceRaw: string | number
): Promise<{ date_choice: string; departure_id: string | null }> {
  const raw = String(dateChoiceRaw).trim()

  if (!isNumericDateChoice(raw)) {
    return {
      date_choice: raw,
      departure_id: await findDepartureIdByLabel(supabase, batchSlug, raw),
    }
  }

  const index = Number(raw)
  const options = await fetchBatchDepartures(supabase, batchSlug)
  const picked = options[index]
  if (picked?.label) {
    return {
      date_choice: picked.label,
      departure_id:
        picked.id ?? (await findDepartureIdByLabel(supabase, batchSlug, picked.label)),
    }
  }

  const label = resolveIndexToLabelAt(index, batchSlug, new Date())
  if (label) {
    return {
      date_choice: label,
      departure_id: await findDepartureIdByLabel(supabase, batchSlug, label),
    }
  }

  return { date_choice: raw, departure_id: null }
}
