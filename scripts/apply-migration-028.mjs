#!/usr/bin/env node
/**
 * Apply migration 028 (dm_annotations table) via direct Postgres connection.
 * Requires SUPABASE_DB_URL in .env.local
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

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

const dbUrl = process.env.SUPABASE_DB_URL
if (!dbUrl) {
  console.error(
    'Missing SUPABASE_DB_URL. Add your Postgres connection string to .env.local (Supabase → Settings → Database → Connection string → URI).'
  )
  process.exit(1)
}

const sql = readFileSync(
  resolve(root, 'supabase/migrations/028_create_annotations_table.sql'),
  'utf8'
)

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query(sql)
  const { rows } = await client.query(
    "SELECT to_regclass('public.dm_annotations') AS table_name"
  )
  console.log('Migration 028 applied successfully.')
  console.log('Table:', rows[0]?.table_name ?? '(not found)')
} catch (err) {
  console.error('Migration failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
