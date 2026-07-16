import { getBatchDateOptions } from '@/constants/batches'
import { generateFridayDepartures } from '@/lib/batch-departure-dates'
import { resolveApplicantDepartureLabel } from '@/lib/admin-applicant-filters'
import { daysUntil, parseDateOnly } from '@/lib/partner-trip-dates'
import type { DepartureState, DepartureTone, DepartureUrgencyTier } from '@/lib/nurture/types'
import type { MatchableBatchSlug } from '@/types/match'
import type { SupabaseClient } from '@supabase/supabase-js'

export type DepartureRow = {
  label: string
  departure_date: string
}

export type ResolvedDepartureUrgency = {
  tier: DepartureUrgencyTier
  daysUntil: number | null
  pickedLabel: string | null
  departureDate: string | null
  effectiveLabel: string | null
  effectiveDate: string | null
  isPassed: boolean
  pivotLabel: string | null
  pivotDate: string | null
  pivotDaysUntil: number | null
  state: DepartureState | 'passed'
  fomoLine: string
  ctaDateLine: string
  urgencyPrefix: string | null
  tone: DepartureTone
}

function todayDateOnly(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function scarcityLine(vacantTotal: number): string {
  return vacantTotal > 0
    ? `${vacantTotal} spot${vacantTotal === 1 ? '' : 's'} still open on your edition`
    : 'Spots are filling fast on your edition'
}

function shortDayLabel(fullLabel: string): string {
  const parts = fullLabel.replace(/,/g, '').split(/\s+/)
  if (parts.length >= 3) {
    return `${parts[0]}, ${parts[1]} ${parts[2]}`
  }
  return fullLabel
}

export function resolveDepartureLabelInput(
  quizLabel: string | null,
  dateChoice: string | null | undefined,
  batchSlug: MatchableBatchSlug
): string | null {
  if (quizLabel?.trim()) return quizLabel.trim()
  return resolveApplicantDepartureLabel(dateChoice, batchSlug)
}

function departureFromGenerated(label: string): DepartureRow | null {
  const normalized = label.trim().toLowerCase()
  for (const row of generateFridayDepartures()) {
    if (row.label.trim().toLowerCase() === normalized) {
      return { label: row.label, departure_date: row.departure_date }
    }
  }
  return null
}

function departureFromOptions(label: string, batchSlug: MatchableBatchSlug): DepartureRow | null {
  const normalized = label.trim().toLowerCase()
  for (const opt of getBatchDateOptions(batchSlug)) {
    if (opt.label.trim().toLowerCase() === normalized) {
      const generated = departureFromGenerated(opt.label)
      if (generated) return generated
    }
  }
  return departureFromGenerated(label)
}

async function lookupDepartureByLabel(
  supabase: SupabaseClient,
  batchSlug: MatchableBatchSlug,
  label: string
): Promise<DepartureRow | null> {
  const { data } = await supabase
    .from('batch_departures')
    .select('label, departure_date')
    .eq('batch_slug', batchSlug)
    .eq('status', 'open')
    .ilike('label', label.trim())
    .maybeSingle()

  if (data?.departure_date && data.label) {
    return { label: data.label, departure_date: data.departure_date }
  }

  return departureFromOptions(label, batchSlug)
}

async function fetchNextOpenDeparture(
  supabase: SupabaseClient,
  batchSlug: MatchableBatchSlug
): Promise<DepartureRow | null> {
  const today = todayDateOnly().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('batch_departures')
    .select('label, departure_date')
    .eq('batch_slug', batchSlug)
    .eq('status', 'open')
    .gte('departure_date', today)
    .order('departure_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (data?.departure_date && data.label) {
    return { label: data.label, departure_date: data.departure_date }
  }

  const fallback = generateFridayDepartures().find((row) => row.departure_date >= today)
  return fallback ? { label: fallback.label, departure_date: fallback.departure_date } : null
}

export function classifyDepartureTier(daysUntilDeparture: number | null): DepartureUrgencyTier {
  if (daysUntilDeparture === null) return 'no_date'
  if (daysUntilDeparture < 0) return 'passed'
  if (daysUntilDeparture <= 2) return 'critical'
  if (daysUntilDeparture <= 7) return 'urgent'
  if (daysUntilDeparture <= 21) return 'warm'
  return 'standard'
}

function daysLabel(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return '1 day'
  return `${days} days`
}

export function buildUrgencyCopy(opts: {
  tier: DepartureUrgencyTier
  pickedLabel: string | null
  effectiveLabel: string | null
  daysUntil: number | null
  pivotLabel: string | null
  pivotDaysUntil: number | null
  nearestLabel: string | null
  vacantTotal: number
  batchLabel: string
}): Pick<
  ResolvedDepartureUrgency,
  'fomoLine' | 'ctaDateLine' | 'urgencyPrefix' | 'tone'
> {
  const scarcity = scarcityLine(opts.vacantTotal)
  const effective = opts.effectiveLabel ?? opts.pickedLabel ?? opts.nearestLabel
  const shortEffective = effective ? shortDayLabel(effective) : null

  switch (opts.tier) {
    case 'critical': {
      const days = opts.daysUntil ?? 0
      return {
        urgencyPrefix: `⏱ ${daysLabel(days)} until your batch leaves`,
        fomoLine: `You picked ${opts.pickedLabel ?? effective}. That batch closes booking soon — ${scarcity}. Boys and girls fill separately. After this Friday, this date is gone.`,
        ctaDateLine: shortEffective
          ? `Lock your spot for ${shortEffective}${days === 0 ? ' — today' : ''}`
          : 'Lock your spot today',
        tone: 'hard',
      }
    }
    case 'urgent':
      return {
        urgencyPrefix: `⏱ ${daysLabel(opts.daysUntil ?? 0)} until departure`,
        fomoLine: `Your date — ${opts.pickedLabel ?? effective} — is ${opts.daysUntil} days away. ${scarcity}. Reserve with a deposit now and pay the rest once you're approved.`,
        ctaDateLine: shortEffective ? `Confirm ${shortEffective} before spots fill` : 'Confirm your date before spots fill',
        tone: 'firm',
      }
    case 'warm':
      return {
        urgencyPrefix: null,
        fomoLine: `You picked ${opts.pickedLabel ?? effective}. ${scarcity} — gender slots don't wait for everyone.`,
        ctaDateLine: shortEffective ? `Confirm your spot for ${shortEffective}` : 'Confirm your spot',
        tone: 'normal',
      }
    case 'standard':
      return {
        urgencyPrefix: null,
        fomoLine: opts.pickedLabel
          ? `You picked ${opts.pickedLabel}. ${scarcity}. Weekly Friday departures — Manali, Kasol, Sissu.`
          : `${scarcity}. Weekly Friday departures — Manali, Kasol, Sissu.`,
        ctaDateLine: shortEffective ? `Confirm your spot for ${shortEffective}` : 'Choose your date & reserve',
        tone: 'normal',
      }
    case 'passed':
      return {
        urgencyPrefix: 'Your saved date has passed — but your profile hasn\'t',
        fomoLine: opts.pickedLabel
          ? `You picked ${opts.pickedLabel} — that batch has already departed. Your quiz and compatibility profile are still saved. The next open ${opts.batchLabel} departure is ${opts.pivotLabel ?? 'coming soon'}${opts.pivotDaysUntil != null ? ` (${daysLabel(opts.pivotDaysUntil)} away)` : ''}.`
          : `Your saved departure date has passed. The next open ${opts.batchLabel} departure is ${opts.pivotLabel ?? 'coming soon'}.`,
        ctaDateLine: opts.pivotLabel ? `Book for ${shortDayLabel(opts.pivotLabel)} instead` : 'Pick your next Friday',
        tone: 'soft',
      }
    default:
      return {
        urgencyPrefix: null,
        fomoLine: opts.nearestLabel
          ? `Our next open Friday departure is ${opts.nearestLabel}. ${scarcity}.`
          : `${scarcity}. Weekly Friday departures — Manali, Kasol, Sissu.`,
        ctaDateLine: 'Pick your date & reserve your slot',
        tone: 'soft',
      }
  }
}

export async function resolveDepartureUrgency(
  supabase: SupabaseClient,
  batchSlug: MatchableBatchSlug,
  opts: {
    quizLabel: string | null
    dateChoice: string | null | undefined
    vacantTotal: number
    batchLabel: string
  }
): Promise<ResolvedDepartureUrgency> {
  const pickedLabel = resolveDepartureLabelInput(opts.quizLabel, opts.dateChoice, batchSlug)
  const nearest = await fetchNextOpenDeparture(supabase, batchSlug)

  if (!pickedLabel) {
    const copy = buildUrgencyCopy({
      tier: 'no_date',
      pickedLabel: null,
      effectiveLabel: nearest?.label ?? null,
      daysUntil: null,
      pivotLabel: null,
      pivotDaysUntil: null,
      nearestLabel: nearest?.label ?? null,
      vacantTotal: opts.vacantTotal,
      batchLabel: opts.batchLabel,
    })
    return {
      tier: 'no_date',
      daysUntil: null,
      pickedLabel: null,
      departureDate: null,
      effectiveLabel: nearest?.label ?? null,
      effectiveDate: nearest?.departure_date ?? null,
      isPassed: false,
      pivotLabel: nearest?.label ?? null,
      pivotDate: nearest?.departure_date ?? null,
      pivotDaysUntil: nearest ? daysUntil(parseDateOnly(nearest.departure_date)) : null,
      state: 'skipped',
      ...copy,
    }
  }

  const row = await lookupDepartureByLabel(supabase, batchSlug, pickedLabel)
  const departureDate = row?.departure_date ?? null
  const resolvedLabel = row?.label ?? pickedLabel
  const days = departureDate ? daysUntil(parseDateOnly(departureDate)) : null
  const tier = classifyDepartureTier(days)

  let pivot = nearest
  if (tier === 'passed') {
    const today = todayDateOnly().toISOString().slice(0, 10)
    if (pivot?.departure_date === departureDate) {
      const { data } = await supabase
        .from('batch_departures')
        .select('label, departure_date')
        .eq('batch_slug', batchSlug)
        .eq('status', 'open')
        .gt('departure_date', today)
        .order('departure_date', { ascending: true })
        .limit(1)
        .maybeSingle()
      pivot = data?.departure_date && data.label ? data : await fetchNextOpenDeparture(supabase, batchSlug)
    }
  }

  const pivotDaysUntil = pivot?.departure_date ? daysUntil(parseDateOnly(pivot.departure_date)) : null
  const effectiveLabel = tier === 'passed' ? (pivot?.label ?? resolvedLabel) : resolvedLabel
  const effectiveDate = tier === 'passed' ? (pivot?.departure_date ?? null) : departureDate

  const copy = buildUrgencyCopy({
    tier,
    pickedLabel: resolvedLabel,
    effectiveLabel,
    daysUntil: days,
    pivotLabel: pivot?.label ?? null,
    pivotDaysUntil,
    nearestLabel: nearest?.label ?? null,
    vacantTotal: opts.vacantTotal,
    batchLabel: opts.batchLabel,
  })

  return {
    tier,
    daysUntil: days,
    pickedLabel: resolvedLabel,
    departureDate,
    effectiveLabel,
    effectiveDate,
    isPassed: tier === 'passed',
    pivotLabel: pivot?.label ?? null,
    pivotDate: pivot?.departure_date ?? null,
    pivotDaysUntil,
    state: tier === 'passed' ? 'passed' : 'selected',
    ...copy,
  }
}

/** Stop sending once departure day has ended (6 PM IST) and lead still has not paid. */
export function shouldStopAfterDepartureWindow(
  urgency: ResolvedDepartureUrgency,
  now: Date = new Date()
): boolean {
  if (!urgency.departureDate || urgency.isPassed) return false
  if (urgency.daysUntil === null || urgency.daysUntil > 0) return false

  const istOffsetMs = (5 * 60 + 30) * 60 * 1000
  const istNow = new Date(now.getTime() + istOffsetMs)
  const istHour = istNow.getUTCHours()
  const istMinute = istNow.getUTCMinutes()
  const istMinutes = istHour * 60 + istMinute
  const cutoffMinutes = 18 * 60

  return urgency.daysUntil === 0 && istMinutes >= cutoffMinutes
}
