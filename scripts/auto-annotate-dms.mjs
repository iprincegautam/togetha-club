#!/usr/bin/env node
/**
 * LLM auto-annotation: writes winning responses for all dm_annotations rows.
 * Replaces human annotator workflow with Anthropic Claude.
 *
 *   node scripts/auto-annotate-dms.mjs [--limit 50] [--force] [--dry-run]
 *
 * Requires ANTHROPIC_API_KEY in .env.local
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'
import { createScriptSupabaseClient } from './lib/supabase-client.mjs'
import { AUTO_ANNOTATE_SYSTEM_PROMPT } from './lib/annotation-prompts.mjs'
import { loadEnvLocal, loadEnvLocalForce, projectRoot as root } from './lib/env.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const ANNOTATOR_NAME = 'LLM Auto-Annotator (Priya SMM)'
const MODEL = 'claude-sonnet-4-6'
const WINNING_MAX = 280
const CONCURRENCY = 3
const DELAY_MS = 400

const VALID_FAILURE_REASONS = new Set([
  'wrong_category',
  'ignored_question',
  'too_long',
  'too_vague',
  'made_up_info',
  'wrong_followup',
  'generic_reply',
])

const VALID_CATEGORIES = new Set([
  'general_interest',
  'pricing_payment',
  'how_to_join',
  'destination_question',
  'accommodation',
  'payment_failure',
  'frustrated_user',
  'cold_lead',
])

function normalizeFailureReason(value) {
  if (!value) return 'generic_reply'
  const key = String(value).toLowerCase().trim().replace(/\s+/g, '_')
  if (VALID_FAILURE_REASONS.has(key)) return key
  if (key.includes('long')) return 'too_long'
  if (key.includes('vague')) return 'too_vague'
  if (key.includes('generic')) return 'generic_reply'
  if (key.includes('ignore')) return 'ignored_question'
  if (key.includes('category')) return 'wrong_category'
  if (key.includes('follow')) return 'wrong_followup'
  if (key.includes('made') || key.includes('invent') || key.includes('fabricat')) return 'made_up_info'
  return 'generic_reply'
}

function normalizeCategory(value, fallback) {
  const key = String(value || fallback || 'general_interest')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
  return VALID_CATEGORIES.has(key) ? key : fallback || 'general_interest'
}

function normalizeUrgency(value, fallback) {
  const key = String(value || fallback || 'low').toLowerCase().trim()
  return key === 'high' || key === 'medium' || key === 'low' ? key : fallback || 'low'
}

function parseArgs() {
  const args = process.argv.slice(2)
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const limitFlag = args.indexOf('--limit')
  let limit = null
  if (limitArg) limit = parseInt(limitArg.split('=')[1], 10)
  else if (limitFlag !== -1 && args[limitFlag + 1]) limit = parseInt(args[limitFlag + 1], 10)
  return {
    limit,
    force: args.includes('--force'),
    dryRun: args.includes('--dry-run'),
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function parseJson(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON in response: ${text.slice(0, 200)}`)
  return JSON.parse(jsonMatch[0])
}

loadEnvLocalForce(['ANTHROPIC_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('Missing ANTHROPIC_API_KEY in .env.local')
  process.exit(1)
}

const { limit, force, dryRun } = parseArgs()
const anthropic = new Anthropic({ apiKey })
const supabase = createScriptSupabaseClient()

let query = supabase
  .from('dm_annotations')
  .select('*')
  .order('message_id', { ascending: true })

if (!force) {
  query = query.or('winning_response.is.null,winning_response.eq.')
}

const { data: rows, error } = await query

if (error) {
  console.error('Failed to fetch annotations:', error.message)
  process.exit(1)
}

let toProcess = rows ?? []
if (limit && limit > 0) toProcess = toProcess.slice(0, limit)

if (toProcess.length === 0) {
  console.log('No rows to auto-annotate. Use --force to re-process all rows.')
  process.exit(0)
}

console.log(`Auto-annotating ${toProcess.length} row(s) with ${MODEL}${dryRun ? ' (dry run)' : ''}...`)

const reportDir = resolve(root, 'scripts/output')
mkdirSync(reportDir, { recursive: true })
const reportPath = resolve(reportDir, `auto-annotate-report-${Date.now()}.json`)
const report = {
  started_at: new Date().toISOString(),
  model: MODEL,
  total: toProcess.length,
  success: 0,
  failed: 0,
  flagged: 0,
  failures: [],
  samples: [],
}

async function annotateRow(row) {
  const userContent = [
    `Message ID: ${row.message_id}`,
    `Category (heuristic): ${row.category ?? 'unknown'}`,
    `Urgency (heuristic): ${row.urgency ?? 'unknown'}`,
    '',
    'User DM:',
    row.user_message,
    '',
    'Agent losing response:',
    row.losing_response?.trim() || '(empty — agent never replied)',
  ].join('\n')

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: AUTO_ANNOTATE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  })

  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

  const result = parseJson(text)
  let winning = (result.winning_response || '').trim()
  if (winning.length > WINNING_MAX) {
    winning = winning.slice(0, WINNING_MAX - 1) + '…'
  }

  const now = new Date().toISOString()
  const update = {
    failure_reason: normalizeFailureReason(result.failure_reason),
    tone_score_losing: Math.min(5, Math.max(1, Number(result.tone_score_losing) || 3)),
    conversion_score_winning: Math.min(5, Math.max(1, Number(result.conversion_score_winning) || 3)),
    winning_response: winning,
    annotator_notes: result.annotator_notes || null,
    is_flagged: Boolean(result.is_flagged),
    category: normalizeCategory(result.category, row.category),
    urgency: normalizeUrgency(result.urgency, row.urgency),
    annotator_name: ANNOTATOR_NAME,
    annotation_status: 'reviewed',
    submitted_at: row.submitted_at || now,
    reviewed_at: now,
    rejection_reason: null,
  }

  if (!dryRun) {
    const { error: updateError } = await supabase
      .from('dm_annotations')
      .update(update)
      .eq('id', row.id)
    if (updateError) throw new Error(updateError.message)
  }

  return { ...result, winning_response: winning }
}

async function worker(queue) {
  while (queue.length > 0) {
    const row = queue.shift()
    if (!row) break
    try {
      const result = await annotateRow(row)
      report.success += 1
      if (result.is_flagged) report.flagged += 1
      if (report.samples.length < 5) {
        report.samples.push({
          message_id: row.message_id,
          user_message: row.user_message.slice(0, 120),
          winning_response: result.winning_response,
          failure_reason: result.failure_reason,
        })
      }
      console.log(
        `[${report.success + report.failed}/${toProcess.length}] ${row.message_id} ✓${result.is_flagged ? ' (flagged)' : ''}`
      )
    } catch (err) {
      report.failed += 1
      report.failures.push({ message_id: row.message_id, error: err.message })
      console.error(`${row.message_id} failed:`, err.message)
    }
    await sleep(DELAY_MS)
  }
}

const queue = [...toProcess]
const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker(queue))
await Promise.all(workers)

report.finished_at = new Date().toISOString()
writeFileSync(reportPath, JSON.stringify(report, null, 2))

console.log('\n--- Auto-annotate summary ---')
console.log(`Success: ${report.success}`)
console.log(`Failed: ${report.failed}`)
console.log(`Flagged (needs human): ${report.flagged}`)
console.log(`Report: ${reportPath}`)
if (dryRun) console.log('Dry run — no database updates written.')
