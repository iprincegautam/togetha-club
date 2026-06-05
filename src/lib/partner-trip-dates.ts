/** Parse YYYY-MM-DD as local calendar date (no UTC shift). */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isFriday(date: Date): boolean {
  return date.getDay() === 5
}

export function isWednesday(date: Date): boolean {
  return date.getDay() === 3
}

/** Fri → following Wed (6-day block). */
export function wednesdayAfterFriday(friday: Date): Date {
  if (!isFriday(friday)) {
    throw new Error('Trip must start on a Friday.')
  }
  const end = new Date(friday)
  end.setDate(end.getDate() + 5)
  if (!isWednesday(end)) {
    throw new Error('Could not compute Wednesday return date.')
  }
  return end
}

export function formatTripDateRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return `${fmt(start)} → ${fmt(end)}`
}

export function validateCustomFridayStart(dateInput: string): { start: Date; end: Date; label: string } {
  const start = parseDateOnly(dateInput)
  if (Number.isNaN(start.getTime())) {
    throw new Error('Invalid date.')
  }
  if (!isFriday(start)) {
    throw new Error('Complimentary trips must start on a Friday.')
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (start < today) {
    throw new Error('Pick a Friday in the future.')
  }
  const end = wednesdayAfterFriday(start)
  return { start, end, label: formatTripDateRange(start, end) }
}

const SIX_MONTHS_MS = 183 * 86400000

export function addSixMonths(from: Date): Date {
  const d = new Date(from)
  d.setMonth(d.getMonth() + 6)
  return d
}

export function daysUntil(date: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

export { SIX_MONTHS_MS }
