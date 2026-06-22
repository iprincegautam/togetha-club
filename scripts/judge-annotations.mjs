#!/usr/bin/env node
/**
 * Score approved annotations with Claude and write judge results back to Supabase.
 *   node scripts/judge-annotations.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'
import { createScriptSupabaseClient } from './lib/supabase-client.mjs'
import { JUDGE_SYSTEM_PROMPT } from './lib/annotation-prompts.mjs'
import { loadEnvLocal, loadEnvLocalForce } from './lib/env.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

loadEnvLocalForce(['ANTHROPIC_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('Missing ANTHROPIC_API_KEY in .env.local')
  process.exit(1)
}

const SYSTEM_PROMPT = JUDGE_SYSTEM_PROMPT

const force = process.argv.includes('--force')

const anthropic = new Anthropic({ apiKey })
const supabase = createScriptSupabaseClient()

async function scoreResponse(userMessage, agentResponse) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `User DM:\n${userMessage}\n\nAgent response:\n${agentResponse}`,
      },
    ],
  })

  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`Could not parse judge JSON: ${text.slice(0, 200)}`)
  }

  return JSON.parse(jsonMatch[0])
}

const { data: rows, error } = await supabase
  .from('dm_annotations')
  .select('*')
  .eq('annotation_status', 'reviewed')
  .not('winning_response', 'is', null)
  .neq('winning_response', '')
  .order('message_id', { ascending: true })

if (error) {
  console.error('Failed to fetch annotations:', error.message)
  process.exit(1)
}

let toJudge = (rows ?? []).filter((r) => r.losing_response?.trim())
if (!force) {
  toJudge = toJudge.filter((r) => r.judge_score_losing == null)
}

if (toJudge.length === 0) {
  console.log('No annotations waiting for judge scoring.')
  process.exit(0)
}

console.log(`Judging ${toJudge.length} annotation(s)...`)

let processed = 0
const losingScores = []
const winningScores = []
const deltas = []
const ranked = []

for (const row of toJudge) {
  if (!row.losing_response?.trim() || !row.winning_response?.trim()) {
    console.warn(`Skipping ${row.message_id}: missing losing or winning response`)
    continue
  }

  try {
    const losing = await scoreResponse(row.user_message, row.losing_response)
    const winning = await scoreResponse(row.user_message, row.winning_response)
    const delta = Number((winning.overall - losing.overall).toFixed(1))

    const { error: updateError } = await supabase
      .from('dm_annotations')
      .update({
        judge_score_losing: losing.overall,
        judge_score_winning: winning.overall,
        improvement_delta: delta,
        judge_verdict_losing: losing.one_line_verdict,
        judge_verdict_winning: winning.one_line_verdict,
      })
      .eq('id', row.id)

    if (updateError) {
      console.error(`${row.message_id} update failed:`, updateError.message)
      continue
    }

    processed += 1
    losingScores.push(losing.overall)
    winningScores.push(winning.overall)
    deltas.push(delta)
    ranked.push({ message_id: row.message_id, delta })
    console.log(`${row.message_id}: losing ${losing.overall} → winning ${winning.overall} (Δ ${delta})`)
  } catch (err) {
    console.error(`${row.message_id} judge failed:`, err.message)
  }
}

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

ranked.sort((a, b) => b.delta - a.delta)
const top5 = ranked.slice(0, 5)

console.log('\n--- Judge summary ---')
console.log(`Total processed: ${processed}`)
console.log(`Average losing score: ${avg(losingScores).toFixed(1)}`)
console.log(`Average winning score: ${avg(winningScores).toFixed(1)}`)
console.log(`Average delta: ${avg(deltas).toFixed(1)}`)
console.log('Top 5 highest delta:')
for (const item of top5) {
  console.log(`  ${item.message_id}: Δ ${item.delta}`)
}
