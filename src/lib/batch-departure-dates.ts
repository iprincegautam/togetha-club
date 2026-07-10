import { getDestinationForBatch, type DestinationSlug } from '@/constants/destinations'
import { wednesdayAfterFriday, parseDateOnly, formatDateOnly } from '@/lib/partner-trip-dates'

/**
 * Alternating Friday schedule (2026 launch window):
 * - 17 Jul Udaipur → 24 Jul Bir (Himalayan) → 31 Jul Udaipur → …
 * - Open only through the last Friday of August 2026.
 * - Each destination date opens both GenZ + Millennial editions
 *   (= two batches per destination on each of its Fridays; ~two Fridays/month).
 */
export const ALTERNATING_SCHEDULE_START = '2026-07-17'
export const ALTERNATING_SCHEDULE_END = '2026-08-28'

/** @deprecated Use ALTERNATING_SCHEDULE_START — kept for older call sites. */
export const BATCH_DEPARTURE_START = ALTERNATING_SCHEDULE_START

/** Show every remaining open slot in the launch window (not a rolling 6 weeks). */
export const VISIBLE_DEPARTURE_WEEKS = 12

/** @deprecated Seed count is derived from the schedule end date. */
export const SEEDED_DEPARTURE_WEEKS = 8

const UDAIPUR_BATCH_SLUGS = new Set(['batch-d', 'batch-e'])

function isUdaipurBatch(batchSlug?: string): boolean {
  return Boolean(batchSlug && UDAIPUR_BATCH_SLUGS.has(batchSlug))
}

function returnDateForBatch(departure: Date, batchSlug?: string): Date {
  const returnDate = new Date(departure)
  if (isUdaipurBatch(batchSlug)) {
    returnDate.setDate(departure.getDate() + 4)
    return returnDate
  }
  return wednesdayAfterFriday(departure)
}

function durationLabelForBatch(batchSlug?: string): string {
  return isUdaipurBatch(batchSlug) ? '2N/3D' : '5N/6D'
}

function formatReturnSublabel(returnDate: Date, batchSlug?: string): string {
  const day = returnDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const duration = durationLabelForBatch(batchSlug)
  const suffix = isUdaipurBatch(batchSlug) ? ' early morning' : ''
  return `Returns ${day}${suffix} · ${duration}`
}

export type DepartureDateOption = {
  label: string
  sublabel: string
  soldOut?: boolean
  departureDate?: string
}

function formatDepartureLabel(friday: Date): string {
  return friday.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export type GeneratedDeparture = {
  label: string
  sublabel: string
  departure_date: string
  return_date: string
  sort_order: number
}

function todayDateOnly(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function weeksBetweenFridays(start: Date, friday: Date): number {
  const ms = friday.getTime() - start.getTime()
  return Math.round(ms / (7 * 24 * 60 * 60 * 1000))
}

/** Udaipur on even weeks from 17 Jul; Bir/Himalayan on odd weeks. */
export function destinationForScheduleFriday(departureDate: string): DestinationSlug {
  const start = parseDateOnly(ALTERNATING_SCHEDULE_START)
  const friday = parseDateOnly(departureDate)
  if (friday.getDay() !== 5) {
    throw new Error(`Schedule dates must be Fridays: ${departureDate}`)
  }
  const week = weeksBetweenFridays(start, friday)
  return week % 2 === 0 ? 'udaipur' : 'himalayan'
}

export function listAlternatingFridays(
  startDate: string = ALTERNATING_SCHEDULE_START,
  endDate: string = ALTERNATING_SCHEDULE_END
): string[] {
  const start = parseDateOnly(startDate)
  const end = parseDateOnly(endDate)
  if (start.getDay() !== 5) {
    throw new Error(`Departure schedule must start on a Friday: ${startDate}`)
  }

  const out: string[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    out.push(formatDateOnly(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }
  return out
}

export function scheduleDatesForDestination(destination: DestinationSlug): string[] {
  return listAlternatingFridays().filter(
    (date) => destinationForScheduleFriday(date) === destination
  )
}

export function scheduleDatesForBatch(batchSlug: string): string[] {
  const destination = getDestinationForBatch(batchSlug)
  if (!destination) return []
  return scheduleDatesForDestination(destination)
}

export function generateFridayDepartures(
  _startDate: string = ALTERNATING_SCHEDULE_START,
  _count: number = SEEDED_DEPARTURE_WEEKS,
  batchSlug?: string
): GeneratedDeparture[] {
  const dates = batchSlug ? scheduleDatesForBatch(batchSlug) : listAlternatingFridays()

  return dates.map((departure_date, index) => {
    const departure = parseDateOnly(departure_date)
    const returnDate = returnDateForBatch(departure, batchSlug)
    return {
      label: formatDepartureLabel(departure),
      sublabel: formatReturnSublabel(returnDate, batchSlug),
      departure_date,
      return_date: formatDateOnly(returnDate),
      sort_order: index + 1,
    }
  })
}

export function isDepartureVisible(
  departureDate: string,
  _weeks: number = VISIBLE_DEPARTURE_WEEKS,
  now: Date = todayDateOnly(),
  batchSlug?: string
): boolean {
  const departure = parseDateOnly(departureDate)
  const end = parseDateOnly(ALTERNATING_SCHEDULE_END)
  if (departure < now || departure > end) return false

  if (batchSlug) {
    const allowed = new Set(scheduleDatesForBatch(batchSlug))
    return allowed.has(departureDate)
  }

  const all = new Set(listAlternatingFridays())
  return all.has(departureDate)
}

export function filterVisibleDepartures<T extends { departure_date?: string | null; batch_slug?: string }>(
  rows: T[],
  weeks: number = VISIBLE_DEPARTURE_WEEKS,
  batchSlug?: string
): T[] {
  return rows.filter((row) => {
    if (!row.departure_date) return false
    const slug = batchSlug ?? row.batch_slug
    return isDepartureVisible(row.departure_date, weeks, todayDateOnly(), slug)
  })
}

export function getFallbackDateOptions(batchSlug: string): DepartureDateOption[] {
  return generateFridayDepartures(ALTERNATING_SCHEDULE_START, SEEDED_DEPARTURE_WEEKS, batchSlug)
    .filter((d) => isDepartureVisible(d.departure_date, VISIBLE_DEPARTURE_WEEKS, todayDateOnly(), batchSlug))
    .map((d) => ({
      label: d.label,
      sublabel: d.sublabel,
      departureDate: d.departure_date,
    }))
}

export function formatShortDepartureDate(departureDate: string): string {
  const date = parseDateOnly(departureDate)
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export function formatShortDepartureListFromDates(dates: string[]): string {
  return dates.map(formatShortDepartureDate).join(', ')
}

export function visibleDepartureShortList(batchSlug: string, asOf?: Date): string {
  const dates = generateFridayDepartures(ALTERNATING_SCHEDULE_START, SEEDED_DEPARTURE_WEEKS, batchSlug)
    .filter((d) =>
      isDepartureVisible(d.departure_date, VISIBLE_DEPARTURE_WEEKS, asOf ?? todayDateOnly(), batchSlug)
    )
    .map((d) => d.departure_date)
  return formatShortDepartureListFromDates(dates)
}

export function buildBatchTripMetaLine(shortDates: string): string {
  return `Manali · Kasol · Sissu · 5N/6D · ${shortDates}`
}

export function buildUdaipurTripMetaLine(shortDates: string): string {
  return `Udaipur · Kumbhalgarh · 2N/3D · ${shortDates}`
}
