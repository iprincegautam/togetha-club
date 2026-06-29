#!/usr/bin/env node
/**
 * Backfill applicants.date_choice (label) + departure_id for numeric sliding-index values.
 *
 * Usage:
 *   node scripts/backfill-applicant-departures.mjs --dry-run
 *   node scripts/backfill-applicant-departures.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createScriptSupabaseClient } from './lib/supabase-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dryRun = process.argv.includes('--dry-run')

function loadEnvLocal() {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i)
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (!process.env[k]) process.env[k] = v
  }
}

loadEnvLocal()

const BATCH_DEPARTURE_START = '2026-06-26'
const VISIBLE_DEPARTURE_WEEKS = 6
const QUIZ_DEPARTURE_QUESTION_ID = 11

function parseDateOnly(value) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDateOnly(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function wednesdayAfterFriday(friday) {
  const wed = new Date(friday)
  wed.setDate(friday.getDate() + 5)
  return wed
}

function formatDepartureLabel(friday) {
  return friday.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function generateFridayDepartures() {
  const friday = parseDateOnly(BATCH_DEPARTURE_START)
  const out = []
  for (let i = 0; i < 26; i++) {
    const departure = new Date(friday)
    departure.setDate(friday.getDate() + i * 7)
    const returnDate = wednesdayAfterFriday(departure)
    out.push({
      label: formatDepartureLabel(departure),
      departure_date: formatDateOnly(departure),
      return_date: formatDateOnly(returnDate),
    })
  }
  return out
}

function isDepartureVisible(departureDate, weeks = VISIBLE_DEPARTURE_WEEKS, now = new Date()) {
  const departure = parseDateOnly(departureDate)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const horizon = new Date(today)
  horizon.setDate(horizon.getDate() + weeks * 7)
  return departure >= today && departure <= horizon
}

function dateLabelOptionsAt(asOf) {
  return generateFridayDepartures()
    .filter((d) => isDepartureVisible(d.departure_date, VISIBLE_DEPARTURE_WEEKS, asOf))
    .map((d) => d.label)
}

function isNumericDateChoice(value) {
  return /^\d+$/.test(String(value).trim())
}

function readQuizDepartureLabel(quizAnswers) {
  if (!quizAnswers || typeof quizAnswers !== 'object') return null
  const raw = quizAnswers[QUIZ_DEPARTURE_QUESTION_ID]
  if (typeof raw !== 'string') return null
  const label = raw.trim()
  return label || null
}

function resolveLabel(row) {
  const slug = row.batch_slug ?? ''
  const depRel = row.batch_departures
  const joined = Array.isArray(depRel) ? depRel[0]?.label : depRel?.label
  if (joined?.trim()) return joined.trim()

  const dateChoice = row.date_choice?.trim()
  if (!dateChoice) {
    return readQuizDepartureLabel(row.quiz_answers)
  }

  if (!isNumericDateChoice(dateChoice)) return dateChoice

  const quizLabel = readQuizDepartureLabel(row.quiz_answers)
  if (quizLabel) return quizLabel

  const index = Number(dateChoice)
  if (!slug || Number.isNaN(index)) return dateChoice

  const bookedAt = row.profile_completed_at ?? row.created_at
  if (bookedAt) {
    const atBooking = dateLabelOptionsAt(new Date(bookedAt))[index]
    if (atBooking) return atBooking
  }

  return dateLabelOptionsAt(new Date())[index] ?? dateChoice
}

function departureDateForLabel(label, departureByLabel) {
  const fromSchedule = generateFridayDepartures().find((d) => d.label === label)
  if (fromSchedule) return fromSchedule.departure_date
  return departureByLabel.get(label) ?? null
}

const supabase = createScriptSupabaseClient()

const { data: departures, error: depError } = await supabase
  .from('batch_departures')
  .select('id, batch_slug, label, departure_date')
  .neq('status', 'cancelled')

if (depError) {
  console.error('Failed to load batch_departures:', depError.message)
  process.exit(1)
}

const departureBySlugLabel = new Map()
const departureBySlugDate = new Map()
for (const dep of departures ?? []) {
  departureBySlugLabel.set(`${dep.batch_slug}::${dep.label}`, dep.id)
  if (dep.departure_date) {
    departureBySlugDate.set(`${dep.batch_slug}::${dep.departure_date}`, dep.id)
  }
}

const { data: applicants, error: appError } = await supabase
  .from('applicants')
  .select(
    'id, email, batch_slug, date_choice, profile_completed_at, created_at, quiz_answers, departure_id, batch_departures ( label )'
  )
  .in('batch_slug', ['batch-a', 'batch-b'])
  .not('date_choice', 'is', null)

if (appError) {
  console.error('Failed to load applicants:', appError.message)
  process.exit(1)
}

let updated = 0
let skipped = 0

for (const row of applicants ?? []) {
  const label = resolveLabel(row)
  if (!label) {
    skipped++
    continue
  }

  const slug = row.batch_slug ?? ''
  const departureDate = departureDateForLabel(label, new Map(
    (departures ?? []).filter((d) => d.batch_slug === slug).map((d) => [d.label, d.departure_date])
  ))
  const departureId =
    departureBySlugLabel.get(`${slug}::${label}`) ??
  (departureDate ? departureBySlugDate.get(`${slug}::${departureDate}`) : null) ??
    row.departure_id

  const needsDateChoice = row.date_choice !== label
  const needsDepartureId = departureId && row.departure_id !== departureId

  if (!needsDateChoice && !needsDepartureId) {
    skipped++
    continue
  }

  const patch = {}
  if (needsDateChoice) patch.date_choice = label
  if (needsDepartureId) patch.departure_id = departureId

  console.log(
    `${dryRun ? '[dry-run] ' : ''}update ${row.email}: ${row.date_choice} → ${label}${departureId ? ` (departure_id ${departureId})` : ''}`
  )

  if (!dryRun) {
    const { error } = await supabase.from('applicants').update(patch).eq('id', row.id)
    if (error) {
      console.error(`  failed: ${error.message}`)
      continue
    }
  }

  updated++
}

console.log(`Done. ${updated} row(s) ${dryRun ? 'would be ' : ''}updated, ${skipped} skipped.`)
