#!/usr/bin/env node
/**
 * Seed dm_annotations from classified_dms.json:
 *   node scripts/seed-annotations.mjs [path/to/classified_dms.json] [--force]
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

const args = process.argv.slice(2)
const force = args.includes('--force')
const filePath = args.find((a) => !a.startsWith('--')) || resolve(root, 'classified_dms.json')
if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  console.error('Place classified_dms.json in the project root or pass a path as the first argument.')
  process.exit(1)
}

const supabase = createScriptSupabaseClient()
const leads = JSON.parse(readFileSync(filePath, 'utf-8'))
console.log(`Seeding ${leads.length} annotations from ${filePath}...`)

const { count: existingCount } = await supabase
  .from('dm_annotations')
  .select('*', { count: 'exact', head: true })

if (existingCount && existingCount > 0 && !force) {
  console.log(`Table already has ${existingCount} rows. Skipping seed to avoid duplicates.`)
  console.log('Pass --force to replace all rows.')
  process.exit(0)
}

if (force && existingCount && existingCount > 0) {
  console.log(`Clearing ${existingCount} existing rows...`)
  const { error: deleteError } = await supabase
    .from('dm_annotations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (deleteError) {
    console.error('Failed to clear table:', deleteError.message)
    process.exit(1)
  }
}

function messageIdFor(index) {
  return `ANN-${String(index + 1).padStart(3, '0')}`
}

const batchSize = 50
let inserted = 0

for (let i = 0; i < leads.length; i += batchSize) {
  const batch = leads.slice(i, i + batchSize).map((lead, batchIndex) => ({
    message_id: messageIdFor(i + batchIndex),
    user_message: lead.raw_message || lead.user_message || '',
    category: lead.category || null,
    urgency: lead.urgency || null,
    losing_response: lead.losing_response || '',
    annotation_status: 'draft',
  }))

  const { error } = await supabase.from('dm_annotations').insert(batch)

  if (error) {
    console.error(`Batch ${i / batchSize + 1} failed:`, error.message)
    process.exit(1)
  }

  inserted += batch.length
  console.log(`Inserted ${inserted}/${leads.length}`)
}

console.log(`Done. ${inserted} annotations seeded with status draft.`)
