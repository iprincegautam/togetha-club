import { wednesdayAfterFriday, parseDateOnly, formatDateOnly } from '@/lib/partner-trip-dates'

export type DepartureDateOption = {
  label: string
  sublabel: string
  soldOut?: boolean
}

/** First Friday departure in the new weekly schedule. */
export const BATCH_DEPARTURE_START = '2026-06-26'

/** How far ahead departures are shown on site and quiz. */
export const VISIBLE_DEPARTURE_WEEKS = 6

/** How many Friday slots to seed in the database (admin horizon). */
export const SEEDED_DEPARTURE_WEEKS = 26

function formatDepartureLabel(friday: Date): string {
  return friday.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatReturnSublabel(wednesday: Date): string {
  const day = wednesday.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return `Returns ${day} · 5N/6D`
}

export type GeneratedDeparture = {
  label: string
  sublabel: string
  departure_date: string
  return_date: string
  sort_order: number
}

export function generateFridayDepartures(
  startDate: string = BATCH_DEPARTURE_START,
  count: number = SEEDED_DEPARTURE_WEEKS
): GeneratedDeparture[] {
  const friday = parseDateOnly(startDate)
  if (friday.getDay() !== 5) {
    throw new Error(`Departure schedule must start on a Friday: ${startDate}`)
  }

  const out: GeneratedDeparture[] = []
  for (let i = 0; i < count; i++) {
    const departure = new Date(friday)
    departure.setDate(friday.getDate() + i * 7)
    const returnDate = wednesdayAfterFriday(departure)
    out.push({
      label: formatDepartureLabel(departure),
      sublabel: formatReturnSublabel(returnDate),
      departure_date: formatDateOnly(departure),
      return_date: formatDateOnly(returnDate),
      sort_order: i + 1,
    })
  }
  return out
}

function todayDateOnly(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function isDepartureVisible(
  departureDate: string,
  weeks: number = VISIBLE_DEPARTURE_WEEKS,
  now: Date = todayDateOnly()
): boolean {
  const departure = parseDateOnly(departureDate)
  const horizon = new Date(now)
  horizon.setDate(horizon.getDate() + weeks * 7)
  return departure >= now && departure <= horizon
}

export function filterVisibleDepartures<T extends { departure_date?: string | null }>(
  rows: T[],
  weeks: number = VISIBLE_DEPARTURE_WEEKS
): T[] {
  return rows.filter((row) => row.departure_date && isDepartureVisible(row.departure_date, weeks))
}

export function getFallbackDateOptions(batchSlug: string): DepartureDateOption[] {
  return generateFridayDepartures()
    .filter((d) => isDepartureVisible(d.departure_date))
    .map((d) => ({
      label: d.label,
      sublabel: d.sublabel,
    }))
}
