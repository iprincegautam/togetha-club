#!/usr/bin/env node
/**
 * Weekly DM lead review — run every Monday:
 *   npm run dm:weekly-review
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createScriptSupabaseClient } from './lib/supabase-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

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

const supabase = createScriptSupabaseClient()

async function weeklyReview() {
  console.log('\n========================================')
  console.log('TOGETHA.CLUB: WEEKLY DM REVIEW')
  console.log(new Date().toDateString())
  console.log('========================================\n')

  const { data: urgent, error: urgentError } = await supabase
    .from('dm_leads')
    .select('sender_name, category, one_line_summary, dm_received_at')
    .eq('urgency', 'high')
    .eq('team_followed_up', false)
    .eq('converted_to_booking', false)
    .order('dm_received_at', { ascending: true })

  if (urgentError) {
    console.error('Failed to load urgent leads:', urgentError.message)
    process.exit(1)
  }

  console.log(`ACTION REQUIRED: ${urgent?.length || 0} high urgency leads not followed up\n`)
  urgent?.forEach((lead, i) => {
    console.log(`  ${i + 1}. ${lead.sender_name}`)
    console.log(`     ${lead.one_line_summary}`)
    console.log(`     Category: ${lead.category}`)
    console.log(`     Received: ${new Date(lead.dm_received_at).toLocaleDateString()}\n`)
  })

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { data: thisWeek, error: weekError } = await supabase
    .from('dm_leads')
    .select('category, urgency')
    .gte('created_at', oneWeekAgo.toISOString())

  if (weekError) {
    console.error('Failed to load weekly leads:', weekError.message)
    process.exit(1)
  }

  const breakdown = {}
  thisWeek?.forEach((lead) => {
    breakdown[lead.category] = (breakdown[lead.category] || 0) + 1
  })

  console.log("THIS WEEK'S DM BREAKDOWN:")
  Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`)
    })

  const { data: converted } = await supabase
    .from('dm_leads')
    .select('id')
    .eq('converted_to_booking', true)
    .gte('created_at', oneWeekAgo.toISOString())

  const { data: escalated } = await supabase
    .from('dm_leads')
    .select('id')
    .eq('escalated_to_human', true)
    .gte('created_at', oneWeekAgo.toISOString())

  console.log(`\nTHIS WEEK'S NUMBERS:`)
  console.log(`  Total DMs this week: ${thisWeek?.length || 0}`)
  console.log(`  Converted to booking: ${converted?.length || 0}`)
  console.log(`  Escalated to human: ${escalated?.length || 0}`)

  const conversionRate = thisWeek?.length
    ? ((converted?.length / thisWeek?.length) * 100).toFixed(1)
    : 0
  console.log(`  Conversion rate: ${conversionRate}%`)

  const { data: paymentFails } = await supabase
    .from('dm_leads')
    .select('sender_name, one_line_summary')
    .eq('category', 'payment_failure')
    .eq('team_followed_up', false)
    .gte('created_at', oneWeekAgo.toISOString())

  if (paymentFails?.length > 0) {
    console.log(`\nPAYMENT FAILURES TO FIX (${paymentFails.length}):`)
    paymentFails.forEach((lead) => {
      console.log(`  - ${lead.sender_name}: ${lead.one_line_summary}`)
    })
  }

  console.log('\n========================================\n')
}

weeklyReview().catch((err) => {
  console.error(err)
  process.exit(1)
})
