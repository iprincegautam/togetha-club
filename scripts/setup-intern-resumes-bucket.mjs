#!/usr/bin/env node
/**
 * Create private Supabase Storage bucket for intern resume uploads.
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const BUCKET = 'intern-resumes'

const listRes = await fetch(`${url}/storage/v1/bucket`, {
  headers: { Authorization: `Bearer ${key}`, apikey: key },
})

if (!listRes.ok) {
  console.error('listBuckets failed:', listRes.status, await listRes.text())
  process.exit(1)
}

const buckets = await listRes.json()
if (Array.isArray(buckets) && buckets.some((b) => b.name === BUCKET)) {
  console.log(`Bucket "${BUCKET}" already exists.`)
  process.exit(0)
}

const createRes = await fetch(`${url}/storage/v1/bucket`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    apikey: key,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: BUCKET,
    public: false,
    file_size_limit: 5 * 1024 * 1024,
    allowed_mime_types: ['application/pdf'],
  }),
})

if (!createRes.ok) {
  console.error('createBucket failed:', createRes.status, await createRes.text())
  process.exit(1)
}

console.log(`Bucket "${BUCKET}" created (private, PDF only, 5MB max).`)
