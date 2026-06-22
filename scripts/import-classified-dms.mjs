#!/usr/bin/env node
/**
 * One-time bulk import from classified_dms.json:
 *   node scripts/import-classified-dms.mjs [path/to/classified_dms.json]
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

const filePath = process.argv[2] || resolve(root, 'classified_dms.json')
if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

const supabase = createScriptSupabaseClient()

const leads = JSON.parse(readFileSync(filePath, 'utf-8'))
console.log(`Importing ${leads.length} leads from ${filePath}...`)

const batchSize = 50
let inserted = 0

for (let i = 0; i < leads.length; i += batchSize) {
  const batch = leads.slice(i, i + batchSize).map((lead) => ({
    sender_name: lead.sender_name || 'unknown',
    instagram_handle: lead.instagram_handle || null,
    raw_message: lead.raw_message || '',
    category: lead.category,
    urgency: lead.urgency,
    one_line_summary: lead.one_line_summary,
    dm_received_at: lead.dm_received_at || new Date().toISOString(),
    classified_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('dm_leads').insert(batch)

  if (error) {
    console.error(`Batch ${i / batchSize + 1} failed:`, error.message)
    process.exit(1)
  }

  inserted += batch.length
  console.log(`Inserted ${inserted}/${leads.length}`)
}

console.log(`Done. ${inserted} leads imported.`)
